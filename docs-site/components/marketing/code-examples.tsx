'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const catalogCode = `import { createCatalog } from '@uischema/core';
import { z } from 'zod';

export const catalog = createCatalog({
  components: {
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
      }),
      hasChildren: true,
    },
    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        format: z.enum(['currency', 'percent']),
      }),
    },
  },
  actions: {
    export: { params: z.object({ format: z.string() }) },
  },
});`;

const generatedCode = `{
  "key": "dashboard",
  "type": "Card",
  "props": {
    "title": "Revenue Dashboard",
    "description": null
  },
  "children": [
    {
      "key": "revenue",
      "type": "Metric",
      "props": {
        "label": "Total Revenue",
        "valuePath": "/metrics/revenue",
        "format": "currency"
      }
    }
  ]
}`;

function CodeBlock({ code, language, onCopy }: { code: string; language: string; onCopy: () => void }) {
  return (
    <div className="relative group border-2 rounded-xl overflow-hidden bg-muted/50">
      <pre className="p-6 overflow-x-auto">
        <code className="text-sm font-mono leading-relaxed">{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
        onClick={onCopy}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CodeExamples() {
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);

  const handleCopyLeft = async () => {
    await navigator.clipboard.writeText(catalogCode);
    setCopiedLeft(true);
    setTimeout(() => setCopiedLeft(false), 2000);
  };

  const handleCopyRight = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopiedRight(true);
    setTimeout(() => setCopiedRight(false), 2000);
  };

  return (
    <section className="container px-4 py-24">
      <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold mb-3">Define your catalog</h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Components, actions, and validation functions.
          </p>
          <CodeBlock code={catalogCode} language="typescript" onCopy={handleCopyLeft} />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-3">AI generates JSON</h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Constrained output that your components render natively.
          </p>
          <CodeBlock code={generatedCode} language="json" onCopy={handleCopyRight} />
        </div>
      </div>
    </section>
  );
}
