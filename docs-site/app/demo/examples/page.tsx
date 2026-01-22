'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { UISchemaDocument } from '@uischema/core';

const examples: Array<{ name: string; description: string; schema: UISchemaDocument }> = [
  {
    name: 'Hello World',
    description: 'A simple greeting with a button',
    schema: {
      schemaVersion: '0.1.0',
      root: {
        type: 'Container',
        props: { className: 'hello-world', ariaLabel: 'Hello world container' },
        children: [
          { type: 'Text', props: { text: 'Hello UISchema' } },
          {
            type: 'Button',
            props: { text: 'Click me', ariaLabel: 'Click the primary action' },
            events: {
              onClick: { type: 'action', name: 'primaryClick', params: { source: 'hello-world' } },
            },
          },
        ],
      },
    },
  },
  {
    name: 'Contact Form',
    description: 'A contact form with name, email, and message fields',
    schema: {
      schemaVersion: '0.1.0',
      root: {
        type: 'Card',
        props: { className: 'contact-form', ariaLabel: 'Contact form' },
        children: [
          { type: 'Text', props: { text: 'Contact Us', className: 'text-2xl font-bold' } },
          {
            type: 'Form',
            props: { className: 'mt-4 space-y-4' },
            children: [
              { type: 'Input', props: { placeholder: 'Name', ariaLabel: 'Name input' } },
              { type: 'Input', props: { placeholder: 'Email', type: 'email', ariaLabel: 'Email input' } },
              { type: 'Textarea', props: { placeholder: 'Message', ariaLabel: 'Message input' } },
              {
                type: 'Button',
                props: { text: 'Submit', ariaLabel: 'Submit button' },
                events: { onClick: { type: 'submit', name: 'submitForm' } },
              },
            ],
          },
        ],
      },
    },
  },
];

export default function ExamplesPage() {
  const handleTryInPlayground = (schema: UISchemaDocument) => {
    // Store in localStorage and redirect
    localStorage.setItem('playground-schema', JSON.stringify(schema));
    window.location.href = '/demo/playground';
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 mb-12">
        <h1 className="text-4xl font-bold mb-2">Examples</h1>
        <p className="text-muted-foreground">
          Explore example UISchema implementations. Click any example to try it in the playground.
        </p>
      </div>
      <div className="container px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examples.map((example) => (
            <div
              key={example.name}
              className="border rounded-lg p-6 hover:border-primary transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">{example.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{example.description}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTryInPlayground(example.schema)}
                >
                  Try in Playground
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
