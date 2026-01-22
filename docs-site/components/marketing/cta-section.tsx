'use client';

import { Button } from '@/components/ui/button';
import { Copy, Check, Github, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function CTASection() {
  const [copied, setCopied] = useState(false);
  const installCommand = 'npm install @uischema/core @uischema/react';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="container px-4 py-8">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 border border-border/50 rounded-lg">
          <code className="text-sm font-mono">{installCommand}</code>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="default" className="h-10 px-6 text-sm">
            <Link href="/docs">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="default" className="h-10 px-6 text-sm">
            <a
              href="https://github.com/skeehn/ui-schema"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
