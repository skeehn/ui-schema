# 🚀 Quick Start - Test Everything

## ✅ Step 1: Install Dependencies (DONE!)
```bash
npm install
```
✅ Fixed! All `workspace:*` references updated to `*` for npm compatibility.

## 📝 Step 2: Set Up Environment File
```bash
# Copy example file
cp .env.example .env

# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-actual-key-here
```

## 🔨 Step 3: Build Packages
```bash
npm run build
```

## 🧪 Step 4: Run All Tests
```bash
# Run everything (including AI tests if API key is set)
npm run test:everything
```

## 📋 What Gets Tested

### Basic Tests (No API Key Needed)
- ✅ File structure
- ✅ Package builds
- ✅ Schema validation
- ✅ Accessibility checks
- ✅ Component rendering
- ✅ AI integration (mock)

### AI Tests (Requires API Key in .env)
- ✅ Real OpenAI API
- ✅ Real Vercel AI SDK
- ✅ Schema generation from AI
- ✅ Streaming updates

## 🎯 Quick Test Commands

```bash
# Test file structure
npm run test:simple

# Build packages
npm run build

# Verify build
npm run verify:build

# Smoke tests
npm test

# Full test suite
npm run test:all

# AI tests (mock - no API key)
npm run test:ai:simple

# Real AI tests (needs API key)
npm run test:openai
npm run test:vercel-ai

# Run everything
npm run test:everything
```

## ✅ Success Checklist

- [x] Dependencies installed
- [ ] .env file created with API key
- [ ] Packages built (`npm run build`)
- [ ] All tests passing (`npm run test:everything`)

## 🎉 You're Ready!

Once tests pass, you can:
1. Use UISchema in your projects
2. Integrate with AI providers
3. Generate UI schemas from prompts
4. Stream UI updates in real-time

## 📚 Next Steps

- **Setup Guide**: See `SETUP_AND_TEST.md`
- **AI Testing**: See `TESTING_WITH_AI.md`
- **API Docs**: See `docs/api-reference.md`
- **Examples**: Check `examples/` directory
