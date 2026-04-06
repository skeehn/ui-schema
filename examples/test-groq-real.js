#!/usr/bin/env node

/**
 * Test UISchema with real Groq API (OpenAI-compatible)
 * Requires GROQ_API_KEY in environment
 */

require('dotenv').config();
const { UISchemaDocumentSchema, validateBasicA11y } = require('@uischema/core');
const { renderUISchema } = require('@uischema/react');
const https = require('https');

function post(url, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: { ...headers, 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
          catch (e) { reject(new Error(`Failed to parse response: ${raw.slice(0, 300)}`)); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('❌ GROQ_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('🤖 Testing UISchema with Groq API...\n');

  const systemPrompt = `You are a UI generator. Generate UISchema JSON documents.

UISchema component types: Container, Row, Column, Grid, Card, List, ListItem, Text, Image, Icon, Badge, Button, Link, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Form, Divider, Spacer.

Rules:
1. All interactive components (Button, Input, Select, Checkbox, etc.) MUST have ariaLabel in props
2. schemaVersion must be "0.1.0"
3. Text supports level: h1, h2, h3, h4, h5, h6, body, caption
4. Button supports variant: primary, secondary, ghost, danger
5. Return valid JSON ONLY — no markdown, no explanation`;

  console.log('📤 Sending request to Groq...');

  let res;
  try {
    res = await post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      {
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        max_tokens: 1500,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
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
    console.error('❌ Groq API error:', res.status, JSON.stringify(res.data?.error ?? res.data));
    process.exit(1);
  }

  console.log('📥 Received response from Groq\n');

  const responseText = res.data.choices?.[0]?.message?.content ?? '';
  let aiSchema;
  try {
    aiSchema = JSON.parse(responseText.trim());
  } catch (err) {
    console.error('❌ Failed to parse JSON response:', err.message);
    console.error('Response:', responseText.slice(0, 300));
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

  const model = res.data.model ?? 'llama-3.3-70b-versatile';
  const tokens = res.data.usage?.total_tokens ?? '?';
  console.log(`\n💡 Model: ${model} | Tokens used: ${tokens}`);
  console.log('\n🎉 All Groq integration tests passed!');
  console.log('✅ UISchema works with Groq!\n');
}

testGroq();
