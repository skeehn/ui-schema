'use client';

import { useState, useRef } from 'react';
import { UISchemaRenderer } from '@uischema/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Zap } from 'lucide-react';
import type { UISchemaDocument } from '@uischema/core';

const EXAMPLE_PROMPTS = [
  'A login form with email and password',
  'A dashboard with 3 metric cards and a chart placeholder',
  'A feedback form with rating stars and a message textarea',
  'A user profile card with avatar, name, role and action buttons',
];

export default function StreamingDemoPage() {
  const [prompt, setPrompt] = useState('');
  const [schema, setSchema] = useState<UISchemaDocument | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async (p: string) => {
    const promptToUse = p.trim();
    if (!promptToUse || isGenerating) return;

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsGenerating(true);
    setError(null);
    setSchema(null);
    setPrompt(promptToUse);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ prompt: promptToUse }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data?.root) throw new Error('Invalid response from API');
      setSchema(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="container px-4 py-6">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">AI → UISchema → UI</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Describe a UI in plain English. Watch it render instantly.
          </p>
        </div>
      </div>

      {/* Prompt bar */}
      <div className="border-b bg-muted/30">
        <div className="container px-4 py-4">
          <form
            className="flex gap-2 max-w-2xl"
            onSubmit={(e) => { e.preventDefault(); generate(prompt); }}
          >
            <Input
              placeholder="Describe the UI you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="flex-1"
            />
            <Button type="submit" disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate
            </Button>
          </form>

          {/* Example prompts */}
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => generate(p)}
                disabled={isGenerating}
                className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main split panel */}
      <div className="container px-4 py-6">
        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {!schema && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">Ready to generate</p>
            <p className="text-sm">Enter a prompt above or click an example to get started.</p>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary opacity-60" />
            <p className="text-sm">Generating your UI...</p>
          </div>
        )}

        {schema && !isGenerating && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Live Preview
              </h2>
              <div className="border rounded-lg p-6 min-h-48 bg-background">
                <UISchemaRenderer
                  schema={schema}
                  onEvent={(name, params) => console.log('Event:', name, params)}
                />
              </div>
            </div>

            {/* Schema JSON */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Generated Schema
              </h2>
              <pre className="border rounded-lg p-4 text-xs font-mono bg-muted/30 overflow-auto max-h-96 leading-relaxed">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
