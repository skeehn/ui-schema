#!/usr/bin/env node

/**
 * Test UISchema with real Anthropic API
 * Requires ANTHROPIC_API_KEY in .env file
 */

require('dotenv').config();
const { UISchemaDocumentSchema, validateBasicA11y } = require('@uischema/core');
const { renderUISchema } = require('@uischema/react');
const https = require('https');

function post(url, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(url, { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { reject(new Error(`Failed to parse response: ${raw.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env file');
    console.error('   Please add your Anthropic API key to .env');
    process.exit(1);
  }

  console.log('🤖 Testing UISchema with Anthropic Claude...\n');

  const systemPrompt = `You are a UI generator. Generate UISchema JSON documents.

UISchema component types:
- Layout: Container, Row, Column, Grid, Card, List, ListItem
- Display: Text, Image, Icon, Badge, Divider, Spacer
- Input: Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider
- Action: Button, Link, Form

Rules:
1. All interactive components MUST have ariaLabel in props
2. schemaVersion must be "0.1.0"
3. Return valid JSON only — no markdown fences, no explanation`;

  console.log('📤 Sending request to Anthropic...');

  let res;
  try {
    res = await post(
      'https://api.anthropic.com/v1/messages',
      {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      {
        model: process.env.AI_SDK_MODEL || 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: 'Create a weather dashboard with temperature and humidity cards, and a refresh button',
          },
        ],
      }
    );
  } catch (err) {
    console.error('❌ Network error:', err.message);
    process.exit(1);
  }

  if (res.status !== 200) {
    console.error('❌ Anthropic API error:', res.status, res.data?.error?.message ?? JSON.stringify(res.data));
    process.exit(1);
  }

  console.log('📥 Received response from Anthropic\n');

  // Extract JSON (handle markdown fences)
  let rawText = res.data.content?.[0]?.text ?? '';
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? rawText.match(/(\{[\s\S]*\})/);
  if (jsonMatch) rawText = jsonMatch[1];

  let aiSchema;
  try {
    aiSchema = JSON.parse(rawText.trim());
  } catch (err) {
    console.error('❌ Failed to parse JSON response:', err.message);
    console.error('Response:', rawText.slice(0, 300));
    process.exit(1);
  }

  // Validate schema
  console.log('🔍 Validating schema...');
  const validation = UISchemaDocumentSchema.safeParse(aiSchema);

  if (!validation.success) {
    console.error('❌ Schema validation failed:');
    validation.error.errors.forEach((err) => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  console.log('✅ Schema validation passed\n');

  // Accessibility check
  console.log('♿ Checking accessibility...');
  const a11yIssues = validateBasicA11y(validation.data.root);
  if (a11yIssues.length > 0) {
    console.warn('⚠️  Accessibility issues found:');
    a11yIssues.forEach((i) => console.warn(`   - ${i.path}: ${i.message}`));
  } else {
    console.log('✅ Accessibility checks passed\n');
  }

  // Render check
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

  console.log('\n🎉 All Anthropic integration tests passed!');
  console.log('✅ UISchema works with Anthropic Claude!\n');
}

testAnthropic();
