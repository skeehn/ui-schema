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

  const handleGenerate = async (prompt: string, model?: string) => {
    if (!prompt.trim()) {
      return;
    }
    
    setIsGenerating(true);
    setGeneratedSchema(null); // Clear previous schema
    
    try {
      const modelToUse = model || 'qwen3-max';
      console.log('🚀 Generating with model:', modelToUse, 'Prompt:', prompt);
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model: modelToUse }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `Failed to generate UI (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Generated schema:', data);
      
      if (!data || !data.root) {
        throw new Error('Invalid response: missing schema data');
      }
      
      setGeneratedSchema(data);
    } catch (error) {
      console.error('❌ Generation error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate UI. Please check your API key and try again.';
      
      // Show error in a more user-friendly way
      alert(`Generation failed: ${errorMessage}\n\nCheck the browser console for details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <HeroSection onGenerate={handleGenerate} isLoading={isGenerating} />
      <InteractiveDemo initialSchema={generatedSchema || undefined} />
      {/* Hidden sections - uncomment to show */}
      {/* <ProcessSection /> */}
      {/* <CodeExamples /> */}
      {/* <FeaturesGrid /> */}
      <CTASection />
      <Footer />
    </div>
  );
}
