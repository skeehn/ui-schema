'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { UISchemaRenderer } from '@uischema/react';
import { validateUISchemaDocument } from '@uischema/core';
import type { UISchemaDocument } from '@uischema/core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamically import Monaco to reduce bundle size
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

const DEFAULT_SCHEMA: UISchemaDocument = {
  schemaVersion: "0.1.0",
  root: {
    type: "Container",
    props: {
      className: "hello-world",
      ariaLabel: "Hello world container"
    },
    children: [
      {
        type: "Text",
        props: {
          text: "Hello UISchema"
        }
      },
      {
        type: "Button",
        props: {
          text: "Click me",
          ariaLabel: "Click the primary action"
        },
        events: {
          onClick: {
            type: "action",
            name: "primaryClick",
            params: {
              source: "hello-world"
            }
          }
        }
      }
    ]
  }
};

interface InteractiveDemoProps {
  initialSchema?: UISchemaDocument;
}

export function InteractiveDemo({ initialSchema }: InteractiveDemoProps) {
  const [schema, setSchema] = useState<UISchemaDocument>(initialSchema || DEFAULT_SCHEMA);
  const [jsonValue, setJsonValue] = useState(() => JSON.stringify(initialSchema || DEFAULT_SCHEMA, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'stream'>('json');
  const [previewTab, setPreviewTab] = useState<'render' | 'code'>('render');

  // Update when initialSchema changes (from AI generation)
  useEffect(() => {
    if (initialSchema) {
      setSchema(initialSchema);
      setJsonValue(JSON.stringify(initialSchema, null, 2));
      setError(null);
    }
  }, [initialSchema]);

  // Debounced schema update
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(jsonValue);
        const validation = validateUISchemaDocument(parsed);
        
        if (validation.success) {
          setSchema(validation.data);
          setError(null);
        } else {
          setError(validation.error?.message || 'Invalid schema');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [jsonValue]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setJsonValue(value);
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExport = () => {
    const blob = new Blob([jsonValue], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uischema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      setJsonValue(JSON.stringify(parsed, null, 2));
    } catch (err) {
      // Invalid JSON, ignore
    }
  };

  return (
    <div className="container px-4 py-4">
      <div className="grid lg:grid-cols-2 gap-4 h-[500px]">
        {/* Left Panel - JSON Editor */}
        <div className="flex flex-col border border-border/50 rounded-lg overflow-hidden bg-card">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'json' | 'stream')}>
              <TabsList className="h-7">
                <TabsTrigger value="json" className="text-xs px-2 py-1 h-6">json</TabsTrigger>
                <TabsTrigger value="stream" className="text-xs px-2 py-1 h-6">stream</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={formatJson}
                className="h-6 px-2 text-xs"
              >
                Format
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="flex-1 relative">
            {error && (
              <div className="absolute top-2 left-2 right-2 z-10 bg-destructive text-destructive-foreground text-sm p-2 rounded">
                {error}
              </div>
            )}
            <MonacoEditor
              height="100%"
              language="json"
              value={jsonValue}
              onChange={handleEditorChange}
              theme="vs"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 8, bottom: 8 },
              }}
            />
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="flex flex-col border border-border/50 rounded-lg overflow-hidden bg-card">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30">
            <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'render' | 'code')}>
              <TabsList className="h-7">
                <TabsTrigger value="render" className="text-xs px-2 py-1 h-6">live render</TabsTrigger>
                <TabsTrigger value="code" className="text-xs px-2 py-1 h-6">static code</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              export
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {previewTab === 'render' ? (
              <div className="min-h-full">
                {error ? (
                  <div className="flex items-center justify-center h-full text-destructive">
                    <div className="text-center">
                      <p className="font-semibold">Invalid Schema</p>
                      <p className="text-sm mt-2">{error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <UISchemaRenderer
                      schema={schema}
                      onEvent={(name, params) => {
                        console.log('UI Event:', name, params);
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <pre className="font-mono text-sm overflow-auto">
                <code>{jsonValue}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
