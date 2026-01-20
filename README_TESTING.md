# 🧪 Testing UISchema - Complete Guide

## Quick Start

```bash
# 1. Set up environment (one time)
cp .env.example .env
# Edit .env and add: OPENAI_API_KEY=sk-your-key-here

# 2. Install dependencies
npm install

# 3. Install AI SDKs (optional, for real AI testing)
npm install openai ai @ai-sdk/openai zod

# 4. Build packages
npm run build

# 5. Run ALL tests (including AI)
npm run test:everything
```

## Test Commands

### Basic Tests (No API Key)
```bash
npm run test:simple      # File structure
npm run build            # Build packages
npm run verify:build     # Verify build output
npm test                 # Smoke tests
npm run test:all         # Full test suite
npm run test:ai:simple   # AI integration (mock)
```

### AI Tests (Requires API Key)
```bash
npm run test:ai         # AI integration (full mock)
npm run test:openai     # Real OpenAI API test
npm run test:vercel-ai   # Real Vercel AI SDK test
```

### Run Everything
```bash
npm run test:everything  # All tests including AI
```

## What Gets Tested

### ✅ Basic Functionality
- File structure and organization
- TypeScript compilation
- Package builds
- Schema validation
- Accessibility checks
- Component rendering

### ✅ AI Integration
- Mock AI responses
- OpenAI structured outputs
- Vercel AI SDK streaming
- Schema validation from AI
- Token efficiency (shorthand)
- Streaming patches
- Coarse-to-fine generation

### ✅ CLI Tools
- Validation command
- Preview server
- Type generation

## Setup Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created (`cp .env.example .env`)
- [ ] API key added to `.env` (for real AI tests)
- [ ] AI SDKs installed (optional: `npm install openai ai @ai-sdk/openai`)
- [ ] Packages built (`npm run build`)
- [ ] Tests passing (`npm run test:everything`)

## Detailed Guides

- **Setup & Test**: `SETUP_AND_TEST.md` - Complete setup instructions
- **Testing with AI**: `TESTING_WITH_AI.md` - Real AI integration guide
- **How to Test**: `HOW_TO_TEST.md` - Step-by-step testing
- **Quick Test**: `QUICK_TEST.md` - Fast verification
- **Start Here**: `START_HERE.md` - Quick start guide

## Troubleshooting

See `SETUP_AND_TEST.md` for detailed troubleshooting.

## Success Criteria

✅ All basic tests pass
✅ AI integration works (mock)
✅ Real AI tests pass (if API key configured)
✅ CLI tools work
✅ Ready for production use!
