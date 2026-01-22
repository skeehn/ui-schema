'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HeroSectionProps {
  onGenerate: (prompt: string, model?: string) => Promise<void>;
  isLoading: boolean;
}

const examplePrompts = [
  "Create a login form",
  "Build a feedback form with rating",
  "Create a contact form",
  "Build a dashboard with metrics",
];

const AVAILABLE_MODELS = [
  // GPT-5.2 Series (Latest)
  { value: 'gpt-5.2-pro', label: 'GPT-5.2 Pro' },
  { value: 'gpt-5.2', label: 'GPT-5.2' },
  { value: 'gpt-5.2-chat', label: 'GPT-5.2 Chat' },
  { value: 'gpt-5.2-codex', label: 'GPT-5.2 Codex' },
  
  // Gemini 3 Series (Latest)
  { value: 'gemini-3-pro', label: 'Gemini 3 Pro' },
  { value: 'gemini-3-flash', label: 'Gemini 3 Flash' },
  
  // Claude Sonnet 4.5 (Latest)
  { value: 'sonnet-4.5', label: 'Claude Sonnet 4.5' },
  
  // Qwen3 Series (Latest)
  { value: 'qwen3-max', label: 'Qwen3 Max' },
  { value: 'qwen3-coder-plus', label: 'Qwen3 Coder Plus' },
  { value: 'qwen3-coder-flash', label: 'Qwen3 Coder Flash' },
  
  // DeepSeek V3.2 Series (Latest)
  { value: 'deepseek-v3.2', label: 'DeepSeek V3.2' },
  { value: 'deepseek-v3.2-speciale', label: 'DeepSeek V3.2 Speciale' },
  { value: 'deepseek-v3.1', label: 'DeepSeek V3.1 Terminus' },
  
  // Other Top Models
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'mistral-large-3', label: 'Mistral Large 3' },
  { value: 'llama-3.3-70b', label: 'Llama 3.3 70B' },
];

export function HeroSection({ onGenerate, isLoading }: HeroSectionProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('qwen3-max'); // Best performing model

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      await onGenerate(prompt.trim(), selectedModel);
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    onGenerate(example, selectedModel);
  };

  return (
    <section className="container px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-medium tracking-normal mb-3 text-center">
          AI → UISchema → UI
        </h1>
        <p className="text-base md:text-lg text-muted-foreground text-center mb-6 max-w-2xl mx-auto leading-relaxed">
          Define a component catalog. Users prompt. AI outputs JSON constrained to your catalog. Your components render it.
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-3">
          <div className="flex gap-0">
            <Input
              type="text"
              placeholder="Describe what you want to build..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 h-10 text-sm rounded-r-none"
              disabled={isLoading}
            />
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
              <SelectTrigger className="w-10 h-10 p-0 border-l-0 rounded-none bg-muted/30 hover:bg-muted/50 [&>svg:last-child]:hidden">
                <SelectValue />
                <svg className="h-4 w-4 mx-auto absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              size="default"
              disabled={isLoading || !prompt.trim()}
              className="h-10 px-3 rounded-l-none"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Try: {examplePrompts.slice(0, 2).map((example, i) => (
            <span key={example}>
              <button
                type="button"
                onClick={() => handleExampleClick(example)}
                className="underline hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                &quot;{example}&quot;
              </button>
              {i < 1 && ' or '}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
