import { NextResponse } from 'next/server';
import type { UISchemaDocument } from '@uischema/core';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // For this example, we'll generate a simple schema based on the prompt
    // In production, you'd use Vercel AI SDK's streamUI with structured output:
    //
    // import { streamUI } from 'ai';
    // import { openai } from '@ai-sdk/openai';
    // import { z } from 'zod';
    // 
    // const result = await streamUI({
    //   model: openai('gpt-4o-mini'),
    //   prompt: `Generate a UISchema JSON document for: ${prompt}`,
    //   schema: z.object({ ... })
    // });
    const generatedSchema: UISchemaDocument = {
      schemaVersion: '0.1.0',
      root: {
        type: 'Container',
        props: {
          ariaLabel: 'Generated dashboard',
          className: 'dashboard-container'
        },
        children: [
          {
            type: 'Text',
            props: {
              text: `Dashboard for: ${prompt}`,
              ariaLabel: 'Dashboard title'
            }
          },
          {
            type: 'Card',
            props: {
              ariaLabel: 'Metric card'
            },
            children: [
              {
                type: 'Text',
                props: {
                  text: 'Metric 1',
                  ariaLabel: 'Metric label'
                }
              },
              {
                type: 'Text',
                props: {
                  text: '100',
                  ariaLabel: 'Metric value'
                }
              }
            ]
          },
          {
            type: 'Button',
            props: {
              text: 'Refresh',
              ariaLabel: 'Refresh dashboard'
            }
          }
        ]
      },
      meta: {
        name: 'Generated Dashboard',
        description: `Dashboard generated from prompt: ${prompt}`
      }
    };

    return NextResponse.json(generatedSchema);
  } catch (error) {
    console.error('Error generating UI:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
