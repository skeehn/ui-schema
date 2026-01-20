'use client';

import { useState } from 'react';
import { UISchemaRenderer } from '@uischema/react';
import type { UISchemaDocument } from '@uischema/core';
import './globals.css';

export default function Home() {
  const [schema, setSchema] = useState<UISchemaDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Create a weather dashboard' })
      });
      if (!response.ok) {
        throw new Error('Failed to generate UI');
      }
      const data = await response.json();
      setSchema(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>UISchema + Next.js + Vercel AI SDK Example</h1>
      <p>This example demonstrates UISchema integration with Next.js and Vercel AI SDK.</p>
      
      <div className="controls">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="button"
        >
          {loading ? 'Generating...' : 'Generate UI'}
        </button>
      </div>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {schema && (
        <div className="schema-container">
          <h2 className="schema-title">Generated UI</h2>
          <UISchemaRenderer
            schema={schema}
            onEvent={(name, params) => {
              // Handle UI events (e.g., button clicks, form submissions)
              // In production, you might send these to analytics or handle business logic
            }}
          />
        </div>
      )}
    </main>
  );
}
