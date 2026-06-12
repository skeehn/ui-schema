const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  generateUISchema,
  parseUISchemaResponse,
  extractJSON,
  UISchemaParseError,
  UISCHEMA_SYSTEM_PROMPT,
  uischemaJsonSchema
} = require("@uischema/ai");

const validDocJSON = JSON.stringify({
  schemaVersion: "0.1.0",
  root: {
    type: "Container",
    props: { ariaLabel: "Root" },
    children: [{ type: "Button", props: { text: "Go", ariaLabel: "Go" } }]
  }
});

// --- parsing ---

test("parseUISchemaResponse accepts a bare JSON document", () => {
  const doc = parseUISchemaResponse(validDocJSON);
  assert.equal(doc.root.type, "Container");
});

test("parseUISchemaResponse strips markdown fences and surrounding prose", () => {
  const doc = parseUISchemaResponse(
    "Here is your UI:\n```json\n" + validDocJSON + "\n```\nLet me know!"
  );
  assert.equal(doc.root.children[0].type, "Button");
});

test("parseUISchemaResponse wraps bare nodes into a document", () => {
  const doc = parseUISchemaResponse('{"type":"Text","props":{"text":"Hi"}}');
  assert.equal(doc.root.type, "Text");
  assert.equal(doc.schemaVersion, "0.1.0");
});

test("parseUISchemaResponse throws UISchemaParseError on non-JSON output", () => {
  assert.throws(() => parseUISchemaResponse("Sorry, I cannot do that."), UISchemaParseError);
});

test("parseUISchemaResponse reports validation errors with paths", () => {
  try {
    parseUISchemaResponse('{"root":{"type":"Button","props":{"text":"x"}}}');
    assert.fail("should have thrown");
  } catch (error) {
    assert.ok(error instanceof UISchemaParseError);
    assert.match(error.validationErrors, /ariaLabel/);
  }
});

test("extractJSON pulls the outermost object out of noisy text", () => {
  assert.equal(extractJSON('noise {"a":{"b":1}} trailing'), '{"a":{"b":1}}');
});

// --- generation via bring-your-own generateText ---

test("generateUISchema works with a custom generateText function", async () => {
  const calls = [];
  const result = await generateUISchema("a login form", {
    generateText: async ({ system, prompt }) => {
      calls.push({ system, prompt });
      return validDocJSON;
    }
  });
  assert.equal(result.document.root.type, "Container");
  assert.deepEqual(result.a11yIssues, []);
  assert.equal(result.raw, validDocJSON);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].system, UISCHEMA_SYSTEM_PROMPT);
  assert.match(calls[0].prompt, /a login form/);
});

test("generateUISchema sends validation errors back for one repair attempt", async () => {
  const prompts = [];
  const result = await generateUISchema("a button", {
    generateText: async ({ prompt }) => {
      prompts.push(prompt);
      return prompts.length === 1
        ? '{"root":{"type":"Button","props":{"text":"x"}}}' // invalid: no ariaLabel
        : validDocJSON;
    }
  });
  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /ariaLabel/, "repair prompt should include the validation errors");
  assert.equal(result.document.root.type, "Container");
});

test("generateUISchema with repair:false fails fast", async () => {
  await assert.rejects(
    () =>
      generateUISchema("a button", {
        repair: false,
        generateText: async () => "not json"
      }),
    UISchemaParseError
  );
});

test("generateUISchema surfaces a11y issues from the generated tree", async () => {
  const result = await generateUISchema("anything", {
    generateText: async () =>
      // schema-valid (Text is not interactive) but a11y-flagged: positive tabIndex
      '{"root":{"type":"Text","props":{"text":"hi","tabIndex":4}}}'
  });
  assert.equal(result.a11yIssues.length, 1);
  assert.match(result.a11yIssues[0].message, /tabIndex/);
});

// --- generation via OpenAI-compatible endpoint (mocked fetch) ---

test("generateUISchema calls any OpenAI-compatible endpoint correctly", async () => {
  let captured;
  const result = await generateUISchema("a card", {
    baseURL: "https://api.example.com/v1/",
    apiKey: "sk-test",
    model: "test-model",
    fetch: async (url, init) => {
      captured = { url, init };
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: validDocJSON } }] })
      };
    }
  });

  assert.equal(result.document.root.type, "Container");
  assert.equal(captured.url, "https://api.example.com/v1/chat/completions");
  assert.equal(captured.init.headers.Authorization, "Bearer sk-test");

  const body = JSON.parse(captured.init.body);
  assert.equal(body.model, "test-model");
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.equal(body.messages[0].role, "system");
  assert.equal(body.messages[1].role, "user");
});

test("jsonMode:false omits response_format for stricter endpoints", async () => {
  let body;
  await generateUISchema("a card", {
    baseURL: "https://api.example.com/v1",
    model: "m",
    jsonMode: false,
    fetch: async (url, init) => {
      body = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: validDocJSON } }] })
      };
    }
  });
  assert.equal(body.response_format, undefined);
});

test("HTTP errors from the endpoint are reported with status and body", async () => {
  await assert.rejects(
    () =>
      generateUISchema("a card", {
        baseURL: "https://api.example.com/v1",
        model: "m",
        repair: false,
        fetch: async () => ({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
          text: async () => '{"error":"rate limited"}'
        })
      }),
    /429.*rate limited/s
  );
});

test("missing configuration is rejected with a clear message", async () => {
  await assert.rejects(() => generateUISchema("a card", {}), /generateText.*baseURL/s);
});

// --- structured outputs schema ---

test("uischemaJsonSchema exposes the core JSON Schema for structured outputs", () => {
  assert.equal(uischemaJsonSchema.title, "UISchema");
  assert.ok(uischemaJsonSchema.properties.root);
});

// --- react re-export ---

test("@uischema/react re-exports the real generateUISchema", () => {
  const react = require("@uischema/react");
  const ai = require("@uischema/ai");
  assert.equal(react.generateUISchema, ai.generateUISchema);
});

test("parseUISchemaResponse tolerates trailing commas (common LLM defect)", () => {
  const doc = parseUISchemaResponse(
    '{"root":{"type":"Text","props":{"text":"hi",},},}'
  );
  assert.equal(doc.root.type, "Text");
});

test("trailing-comma cleanup never touches commas inside strings", () => {
  const doc = parseUISchemaResponse(
    '{"root":{"type":"Text","props":{"text":"a, }b, ]c",},}}'
  );
  assert.equal(doc.root.props.text, "a, }b, ]c");
});
