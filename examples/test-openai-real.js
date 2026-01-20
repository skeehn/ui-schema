#!/usr/bin/env node

/**
 * Test UISchema with real OpenAI API
 * Requires OPENAI_API_KEY in .env file
 */

require('dotenv').config();
const { UISchemaDocumentSchema, validateBasicA11y } = require('@uischema/core');
const { renderUISchema } = require('@uischema/react');

async function testOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env file');
    console.error('   Please add your OpenAI API key to .env');
    process.exit(1);
  }

  console.log('🤖 Testing UISchema with OpenAI...\n');

  try {
    // Dynamic import for ESM module
    const { default: OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('📤 Sending request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a UI generator. Generate UISchema JSON documents.
          
UISchema structure:
{
  "schemaVersion": "0.1.0",
  "root": {
    "type": "Container",
    "props": { "ariaLabel": "..." },
    "children": [
      {
        "type": "Text",
        "props": { "text": "...", "ariaLabel": "..." }
      },
      {
        "type": "Button",
        "props": { "text": "...", "ariaLabel": "..." }
      }
    ]
  }
}

Rules:
- All interactive components (Button, Input, etc.) MUST have ariaLabel
- Use semantic component types: Container, Text, Button, Card, Input, etc.
- Return valid JSON only`
        },
        {
          role: 'user',
          content: 'Create a weather dashboard with temperature and humidity cards, and a refresh button'
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseText = completion.choices[0].message.content;
    console.log('📥 Received response from OpenAI\n');

    // Parse JSON response
    let aiSchema;
    try {
      aiSchema = JSON.parse(responseText);
    } catch (error) {
      console.error('❌ Failed to parse JSON response:', error.message);
      console.error('Response:', responseText);
      process.exit(1);
    }

    // Validate schema
    console.log('🔍 Validating schema...');
    const validation = UISchemaDocumentSchema.safeParse(aiSchema);
    
    if (!validation.success) {
      console.error('❌ Schema validation failed:');
      validation.error.errors.forEach(err => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }

    console.log('✅ Schema validation passed\n');

    // Check accessibility
    console.log('♿ Checking accessibility...');
    const a11yIssues = validateBasicA11y(validation.data.root);
    
    if (a11yIssues.length > 0) {
      console.warn('⚠️  Accessibility issues found:');
      a11yIssues.forEach(issue => {
        console.warn(`   - ${issue.path}: ${issue.message}`);
      });
    } else {
      console.log('✅ Accessibility checks passed\n');
    }

    // Test rendering
    console.log('🎨 Testing render...');
    const element = renderUISchema(validation.data);
    
    if (!element) {
      console.error('❌ Rendering failed');
      process.exit(1);
    }

    console.log('✅ Rendering successful\n');

    // Display schema
    console.log('📊 Generated Schema:');
    console.log(JSON.stringify(validation.data, null, 2));
    console.log('\n');

    console.log('🎉 All OpenAI integration tests passed!');
    console.log('\n✅ UISchema works with OpenAI!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.status === 401) {
      console.error('   Invalid API key. Check your OPENAI_API_KEY in .env');
    } else if (error.status === 429) {
      console.error('   Rate limit exceeded. Try again later.');
    }
    process.exit(1);
  }
}

testOpenAI();
