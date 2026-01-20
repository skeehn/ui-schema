export type ShorthandNode = {
  type: string;
  props: Record<string, string>;
  children: ShorthandNode[];
};

const isIdentChar = (char: string) => /[a-zA-Z0-9_-]/.test(char);

const parseIdentifier = (input: string, start: number) => {
  let i = start;
  while (i < input.length && isIdentChar(input[i])) {
    i += 1;
  }
  return { value: input.slice(start, i), next: i };
};

const parseBracketContent = (input: string, start: number) => {
  let depth = 0;
  let i = start;
  for (; i < input.length; i += 1) {
    if (input[i] === "[") depth += 1;
    if (input[i] === "]") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) {
    throw new Error("Unmatched bracket in shorthand.");
  }
  return { content: input.slice(start + 1, i), next: i + 1 };
};

const parseProps = (content: string) => {
  const props: Record<string, string> = {};
  if (!content.trim()) return props;
  const segments = content.split(";").map((segment) => segment.trim()).filter(Boolean);
  segments.forEach((segment) => {
    const [rawKey, ...rest] = segment.split(":");
    const key = rawKey?.trim();
    if (!key) return;
    const rawValue = rest.join(":").trim();
    const value = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    props[key] = value;
  });
  return props;
};

const splitTopLevel = (content: string, separator: string) => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
};

export const parseShorthand = (input: string): ShorthandNode => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Shorthand input is empty.");
  }

  let index = 0;
  const { value: type, next } = parseIdentifier(trimmed, index);
  if (!type) {
    throw new Error("Expected component identifier at start of shorthand.");
  }
  index = next;

  const node: ShorthandNode = { type, props: {}, children: [] };

  while (index < trimmed.length) {
    if (trimmed[index] !== "[") {
      index += 1;
      continue;
    }
    const { content, next: nextIndex } = parseBracketContent(trimmed, index);
    index = nextIndex;

    const [segmentKey, ...rest] = content.split(":");
    const key = segmentKey.trim();
    const value = rest.join(":").trim();

    if (key === "children") {
      const childSegments = splitTopLevel(value, "|");
      node.children = childSegments.map((segment) => parseShorthand(segment));
    } else {
      Object.assign(node.props, parseProps(content));
    }
  }

  return node;
};
