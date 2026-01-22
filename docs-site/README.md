# UISchema Documentation Site

The official documentation site for UISchema, built with Next.js, shadcn/ui, and featuring an interactive playground.

## Features

- 🎨 **Beautiful Landing Page** - Interactive demo with AI-powered UI generation
- 🎯 **Interactive Playground** - Monaco editor with live preview
- 📚 **Documentation** - Comprehensive guides and API reference
- 🎭 **Animated Background** - Interactive pixel background that responds to cursor
- 🌓 **Dark Mode** - Full theme support
- ⚡ **Fast** - Optimized for performance

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. From the root of the monorepo, build all packages:
   ```bash
   npm run build
   ```

2. Install dependencies for the docs site:
   ```bash
   cd docs-site
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file in docs-site directory
   OPENROUTER_API_KEY=your_key_here
   # OR
   OPENAI_API_KEY=your_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
docs-site/
├── app/                    # Next.js app router
│   ├── (marketing)/       # Marketing pages
│   ├── docs/              # Documentation pages
│   ├── demo/              # Interactive demos
│   └── api/               # API routes
├── components/            # React components
│   ├── marketing/         # Landing page components
│   ├── ui/               # shadcn/ui components
│   └── demo/             # Demo components
├── lib/                   # Utilities
└── content/              # MDX documentation files
```

## Features

### Interactive Demo

The landing page features a split-panel interactive demo:
- **Left Panel**: Monaco editor for editing UISchema JSON
- **Right Panel**: Live preview using UISchemaRenderer
- Real-time validation and error display
- Export functionality

### AI Generation

Enter a prompt in the hero section to generate UISchema JSON using AI:
- **17+ Models Available**: GPT-5.2, Gemini 3, Claude Sonnet 4.5, Qwen3, DeepSeek V3.2, and more
- **Default Model**: Qwen3 Max (fastest and most reliable)
- Uses structured output for valid schemas
- Enhanced error handling with categorized errors
- Loading states and graceful error handling

### Animated Background

Interactive pixel background that:
- Responds to cursor movement
- Features rainbow-colored particles
- Smooth animations and interactions

## Building for Production

```bash
npm run build
npm start
```

## Deployment

The site is configured for Vercel deployment. See the plan for deployment instructions.

## License

MIT
