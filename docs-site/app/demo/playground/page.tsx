'use client';

import { InteractiveDemo } from '@/components/marketing/interactive-demo';

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 mb-8">
        <h1 className="text-4xl font-bold mb-2">UISchema Playground</h1>
        <p className="text-muted-foreground">
          Experiment with UISchema JSON and see live previews. Edit the JSON on the left and watch it render in real-time.
        </p>
      </div>
      <InteractiveDemo />
    </div>
  );
}
