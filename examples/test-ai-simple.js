#!/usr/bin/env node

/**
 * Simple AI integration test
 * Tests UISchema with mock AI responses
 */

const { UISchemaDocumentSchema, validateBasicA11y } = require('@uischema/core');
const { expandShorthand } = require('@uischema/compressed');
const { renderUISchema } = require('@uischema/react');
const { applyPatches, parseJSONLPatches } = require('@uischema/protocol');

console.log('🤖 Testing UISchema with AI Integration\n');

// Test 1: AI generates full JSON schema
console.log('1️⃣  Testing: AI → Full JSON Schema');
const aiGeneratedSchema = {
  schemaVersion: '0.1.0',
  root: {
    type: 'Container',
    props: {
      ariaLabel: 'AI Generated Dashboard'
    },
    children: [
      {
        type: 'Text',
        props: {
          text: 'Welcome to AI Dashboard',
          ariaLabel: 'Dashboard title'
        }
      },
      {
        type: 'Button',
        props: {
          text: 'Get Started',
          ariaLabel: 'Get started button'
        }
      }
    ]
  }
};

const validation = UISchemaDocumentSchema.safeParse(aiGeneratedSchema);
if (!validation.success) {
  console.error('❌ Validation failed:', validation.error.format());
  process.exit(1);
}

const a11yIssues = validateBasicA11y(validation.data.root);
if (a11yIssues.length > 0) {
  console.error('❌ Accessibility issues:', a11yIssues);
  process.exit(1);
}

console.log('✅ AI-generated schema validated\n');

// Test 2: AI generates compressed shorthand
console.log('2️⃣  Testing: AI → Compressed Shorthand');
const aiShorthand = 'c[ariaLabel:Dashboard][children:txt[text:Hello]|btn[text:Click;ariaLabel:Click button]]';
const expanded = expandShorthand(aiShorthand);

if (!expanded || expanded.type !== 'Container') {
  console.error('❌ Shorthand expansion failed');
  process.exit(1);
}

const shorthandLength = aiShorthand.length;
const expandedLength = JSON.stringify(expanded).length;
const reduction = ((1 - shorthandLength / expandedLength) * 100).toFixed(1);

console.log(`✅ Shorthand expanded (${reduction}% token reduction)\n`);

// Test 3: AI streams JSONL patches
console.log('3️⃣  Testing: AI → Streaming Patches');
const initialSchema = {
  type: 'Container',
  props: { ariaLabel: 'Loading...' }
};

const jsonlStream = `{"op":"set","path":"/props/ariaLabel","value":"Dashboard"}
{"op":"add","path":"/children","value":{"type":"Text","props":{"text":"Hello","ariaLabel":"Greeting"}}}`;

const patches = parseJSONLPatches(jsonlStream);
const updated = applyPatches(initialSchema, patches);

if (!updated.children || updated.children.length === 0) {
  console.error('❌ Patches not applied');
  process.exit(1);
}

console.log('✅ Streaming patches applied\n');

// Test 4: Render AI-generated schema
console.log('4️⃣  Testing: AI Schema → Render');
const element = renderUISchema(validation.data);
if (!element) {
  console.error('❌ Rendering failed');
  process.exit(1);
}

console.log('✅ AI-generated schema rendered\n');

console.log('🎉 All AI integration tests passed!');
console.log('\n💡 Next steps:');
console.log('   - Test with real AI: See TESTING_WITH_AI.md');
console.log('   - Try OpenAI: npm install openai');
console.log('   - Try Vercel AI SDK: npm install ai @ai-sdk/openai');
