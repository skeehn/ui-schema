# Next.js + Vercel AI SDK Example

This example demonstrates UISchema integration with Next.js and Vercel AI SDK for streaming generative UI.

## Features

- ✅ Next.js App Router integration
- ✅ Vercel AI SDK structured output
- ✅ UISchema rendering
- ✅ Server Actions support
- ✅ Production-ready pattern

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
OPENAI_API_KEY=your_api_key_here
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Usage

Click "Generate UI" to create a UISchema-based dashboard. The UI is generated server-side using Vercel AI SDK and rendered client-side with UISchema.

## Architecture

- **Server**: `/app/api/generate-ui/route.ts` - API route using Vercel AI SDK
- **Client**: `/app/page.tsx` - React component using UISchemaRenderer
- **Streaming**: Ready for JSONL patch streaming (see `useUIStream` hook)

## Next Steps

- Add streaming UI updates via JSONL patches
- Integrate with real LLM for dynamic schema generation
- Add form validation and interactions
- Implement coarse-to-fine generation pipeline
