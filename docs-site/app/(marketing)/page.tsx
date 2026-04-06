'use client';

import { useState } from 'react';
import { HeroSection } from '@/components/marketing/hero-section';
import { InteractiveDemo } from '@/components/marketing/interactive-demo';
import { ProcessSection } from '@/components/marketing/process-section';
import { CodeExamples } from '@/components/marketing/code-examples';
import { FeaturesGrid } from '@/components/marketing/features-grid';
import { CTASection } from '@/components/marketing/cta-section';
import { Footer } from '@/components/marketing/footer';
import type { UISchemaDocument } from '@uischema/core';

export default function HomePage() {
  const [generatedSchema, setGeneratedSchema] = useState<UISchemaDocument | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, model?: string) => {
    if (!prompt.trim()) {
      return;
    }

    setIsGenerating(true);
    setGeneratedSchema(null);
    setGenerationError(null);

    try {
      const modelToUse = model || 'qwen3-max';

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model: modelToUse }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to generate UI (${response.status})`);
      }

      const data = await response.json();

      if (!data || !data.root) {
        throw new Error('Invalid response: missing schema data');
      }

      setGeneratedSchema(data);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to generate UI. Please check your API key and try again.';
      setGenerationError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <HeroSection
        onGenerate={handleGenerate}
        isLoading={isGenerating}
        error={generationError}
      />
      <InteractiveDemo initialSchema={generatedSchema || undefined} />
      <ProcessSection />
      <CodeExamples />
      <FeaturesGrid />
      <CTASection />
      <Footer />
    </div>
  );
}
