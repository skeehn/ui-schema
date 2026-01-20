# Testing UISchema with Real AI

Complete guide to test UISchema with actual AI/LLM providers.

## Quick Test with Mock AI

First, verify the integration works with mock data:

```bash
npm run test:ai
```

**Expected**: All AI integration tests pass ✅

## Testing with Real AI Providers

### Option 1: OpenAI (Structured Outputs)

#### Setup
```bash
# Install OpenAI SDK
npm install openai

# Set API key
export OPENAI_API_KEY=your_key_here
```

#### Test Script
Create `test-openai.js`:

```javascript
import OpenAI from 'openai';
import { UISchemaDocumentSchema } from '@uischema/core';
import { renderUISchema } from '@uischema/react';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  console.log('🤖 Testing OpenAI structured outputs...');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a UI generator. Generate UISchema JSON for user requests.'
      },
      {
        role: 'user',
        content: 'Create a weather dashboard with temperature and humidity cards'
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'uischema',
        description: 'UISchema document',
        schema: {
          type: 'object',
          properties: {
            schemaVersion: { type: 'string' },
            root: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                props: { type: 'object' },
                children: { type: 'array' }
              },
              required: ['type']
            }
          },
          required: ['root']
        }
      }
    }
  });
  
  const response = JSON.parse(completion.choices[0].message.content);
  
  // Validate
  const validation = UISchemaDocumentSchema.safeParse(response);
  if (!validation.success) {
    console.error('❌ Validation failed:', validation.error);
    return;
  }
  
  console.log('✅ OpenAI response validated');
  console.log('📊 Schema:', JSON.stringify(validation.data, null, 2));
  
  // Render (if in React environment)
  // const element = renderUISchema(validation.data);
  // console.log('✅ Rendered successfully');
}

testOpenAI().catch(console.error);
```

#### Run Test
```bash
node test-openai.js
```

### Option 2: Vercel AI SDK (Streaming)

#### Setup
```bash
npm install ai @ai-sdk/openai
```

#### Test Script
Create `test-vercel-ai.js`:

```javascript
import { streamUI } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { UISchemaDocumentSchema } from '@uischema/core';

async function testVercelAI() {
  console.log('🤖 Testing Vercel AI SDK streaming...');
  
  const result = await streamUI({
    model: openai('gpt-4o-mini'),
    prompt: 'Create a dashboard with a header, two metric cards, and a refresh button',
    schema: z.object({
      schemaVersion: z.string().optional(),
      root: z.object({
        type: z.string(),
        props: z.record(z.unknown()).optional(),
        children: z.array(z.any()).optional()
      }),
      meta: z.object({
        name: z.string().optional(),
        description: z.string().optional()
      }).optional()
    })
  });
  
  // Collect streamed chunks
  let fullResponse = {};
  for await (const chunk of result.partialUIStream) {
    fullResponse = { ...fullResponse, ...chunk };
  }
  
  // Validate
  const validation = UISchemaDocumentSchema.safeParse(fullResponse);
  if (!validation.success) {
    console.error('❌ Validation failed:', validation.error);
    return;
  }
  
  console.log('✅ Vercel AI SDK response validated');
  console.log('📊 Schema:', JSON.stringify(validation.data, null, 2));
}

testVercelAI().catch(console.error);
```

#### Run Test
```bash
node test-vercel-ai.js
```

### Option 3: Anthropic Claude (JSON Mode)

#### Setup
```bash
npm install @anthropic-ai/sdk
export ANTHROPIC_API_KEY=your_key_here
```

#### Test Script
Create `test-claude.js`:

```javascript
import Anthropic from '@anthropic-ai/sdk';
import { UISchemaDocumentSchema } from '@uischema/core';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function testClaude() {
  console.log('🤖 Testing Claude JSON mode...');
  
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate a UISchema JSON document for a task management dashboard.
        
Return valid JSON with this structure:
{
  "schemaVersion": "0.1.0",
  "root": {
    "type": "Container",
    "props": { "ariaLabel": "..." },
    "children": [...]
  }
}`
      }
    ]
  });
  
  const content = message.content[0].text;
  const response = JSON.parse(content);
  
  // Validate
  const validation = UISchemaDocumentSchema.safeParse(response);
  if (!validation.success) {
    console.error('❌ Validation failed:', validation.error);
    return;
  }
  
  console.log('✅ Claude response validated');
  console.log('📊 Schema:', JSON.stringify(validation.data, null, 2));
}

testClaude().catch(console.error);
```

#### Run Test
```bash
node test-claude.js
```

## Testing with Next.js Example

The Next.js example includes AI integration:

```bash
cd examples/nextjs-vercel-ai-sdk

# Install dependencies
npm install

# Set API key
export OPENAI_API_KEY=your_key_here

# Run dev server
npm run dev
```

**Test Flow**:
1. Open http://localhost:3000
2. Click "Generate UI"
3. Verify UI renders correctly
4. Check browser console for any errors

## Testing Streaming Updates

Test JSONL patch streaming:

```javascript
import { useUIStream } from '@uischema/react';

// In your component
const { schema, loading, error } = useUIStream({
  endpoint: '/api/stream-ui', // Your streaming endpoint
  initialSchema: initialSchema
});
```

**API Endpoint Example** (`app/api/stream-ui/route.ts`):

```typescript
import { NextResponse } from 'next/server';
import { streamUI } from 'ai';
import { openai } from '@ai-sdk/openai';
import { serializePatchesToJSONL, createSetPatch } from '@uischema/protocol';

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      // Simulate AI generating patches
      const patches = [
        createSetPatch('/props/ariaLabel', 'Dashboard'),
        createSetPatch('/children/0/props/text', 'Welcome')
      ];
      
      const jsonl = serializePatchesToJSONL(patches);
      controller.enqueue(new TextEncoder().encode(jsonl + '\n'));
      controller.close();
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson'
    }
  });
}
```

## Testing Compressed Shorthand

Test token efficiency with shorthand:

```javascript
import { expandShorthand } from '@uischema/compressed';

// AI generates compact shorthand
const aiShorthand = "c[ariaLabel:Dashboard][children:txt[text:Hello]|btn[text:Click]]";

// Expand to full schema
const fullSchema = expandShorthand(aiShorthand);

// Compare token counts
const shorthandTokens = aiShorthand.length / 4; // Rough estimate
const fullTokens = JSON.stringify(fullSchema).length / 4;
const reduction = ((fullTokens - shorthandTokens) / fullTokens * 100).toFixed(1);

console.log(`Token reduction: ${reduction}%`);
```

## Testing Coarse-to-Fine Pipeline

Test two-stage generation:

```javascript
import { generateLayoutSkeleton, applyPatches } from '@uischema/compressed';

// Stage 1: AI generates coarse layout
const skeleton = generateLayoutSkeleton('Create dashboard');

// Stage 2: AI refines with patches
const refinementPatches = [
  { op: 'set', path: '/children/0/props/text', value: 'Revenue' },
  { op: 'set', path: '/children/1/props/text', value: 'Users' }
];

const refined = applyPatches(skeleton, refinementPatches);
```

## Validation Checklist

After testing with AI:

- [ ] AI generates valid UISchema JSON
- [ ] Schema validation passes
- [ ] Accessibility constraints enforced
- [ ] Rendering works correctly
- [ ] Streaming updates work
- [ ] Events handled properly
- [ ] Token efficiency achieved (with shorthand)
- [ ] Coarse-to-fine pipeline works
- [ ] Spec bridges work (if using Open-JSON-UI, etc.)

## Troubleshooting

### AI returns invalid JSON
**Solution**: Use structured outputs or JSON mode, add validation

### Schema validation fails
**Solution**: Check AI prompt includes schema requirements

### Rendering errors
**Solution**: Verify all required props (especially ariaLabel for interactive components)

### Streaming not working
**Solution**: Check Content-Type header is `application/x-ndjson`

## Success Criteria

✅ AI generates valid UISchema
✅ Schema validates correctly
✅ UI renders without errors
✅ Events work properly
✅ Streaming updates work
✅ Token efficiency achieved

## Next Steps

Once AI integration works:
1. ✅ Integrate into your application
2. ✅ Add error handling
3. ✅ Optimize prompts
4. ✅ Monitor token usage
5. ✅ Add caching if needed
