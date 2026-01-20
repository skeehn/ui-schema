# Complete Setup and Testing Guide

**Everything you need to set up and test UISchema with AI integration.**

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

**If workspace protocol doesn't work:**
```bash
# Use pnpm (recommended)
npm install -g pnpm
pnpm install

# OR install manually in each package
```

### Step 2: Set Up Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your API keys
# OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 3: Install AI SDKs (Optional - for real AI testing)
```bash
# For OpenAI testing
npm install openai

# For Vercel AI SDK testing
npm install ai @ai-sdk/openai zod
```

### Step 4: Build Packages
```bash
npm run build
```

## 🧪 Run All Tests

### Option 1: Run Everything (Recommended)
```bash
npm run test:everything
```

This runs:
- ✅ File structure tests
- ✅ Build verification
- ✅ Smoke tests
- ✅ Full test suite
- ✅ AI integration (mock)
- ✅ CLI tests
- ✅ Real AI tests (if API keys configured)

### Option 2: Run Tests Individually

```bash
# 1. File structure
npm run test:simple

# 2. Build
npm run build

# 3. Verify build
npm run verify:build

# 4. Smoke tests
npm test

# 5. Full test suite
npm run test:all

# 6. AI integration (mock - no API key needed)
npm run test:ai:simple
npm run test:ai

# 7. Real AI tests (requires API key)
npm run test:openai        # OpenAI
npm run test:vercel-ai     # Vercel AI SDK

# 8. CLI tests
npx @uischema/cli validate examples/hello-world/uischema.json
```

## 📋 Test Checklist

### Basic Tests (No API Key Needed)
- [ ] File structure tests pass
- [ ] Packages build successfully
- [ ] Build output verified
- [ ] Smoke tests pass
- [ ] Full test suite passes
- [ ] AI integration (mock) passes
- [ ] CLI validation works

### AI Tests (Requires API Key)
- [ ] .env file created with OPENAI_API_KEY
- [ ] OpenAI SDK installed (`npm install openai`)
- [ ] OpenAI real API test passes
- [ ] Vercel AI SDK installed (`npm install ai @ai-sdk/openai`)
- [ ] Vercel AI SDK test passes

## 🔑 Setting Up API Keys

### 1. Create .env File
```bash
cp .env.example .env
```

### 2. Add Your Keys
Edit `.env`:
```bash
OPENAI_API_KEY=sk-your-actual-key-here
ANTHROPIC_API_KEY=your-key-here  # Optional
```

### 3. Get API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `.env`

**Anthropic (Optional):**
1. Go to https://console.anthropic.com/
2. Create API key
3. Copy to `.env`

## 🎯 Expected Test Results

### Basic Tests
```
✅ File structure tests passed
✅ All packages built
✅ Build output verified
✅ Smoke tests passed
✅ Full test suite passed
✅ AI integration (mock) passed
```

### AI Tests (with API key)
```
✅ OpenAI response validated
✅ Schema validation passed
✅ Accessibility checks passed
✅ Rendering successful
🎉 All OpenAI integration tests passed!
```

## 🐛 Troubleshooting

### "OPENAI_API_KEY not found"
**Solution**: 
1. Create `.env` file: `cp .env.example .env`
2. Add your key: `OPENAI_API_KEY=sk-...`
3. Make sure `.env` is in project root

### "Module not found: openai"
**Solution**: 
```bash
npm install openai
```

### "Module not found: ai"
**Solution**: 
```bash
npm install ai @ai-sdk/openai zod
```

### Tests fail after adding API key
**Solution**: 
1. Check API key is valid (not placeholder)
2. Check you have API credits
3. Check network connection
4. Try: `npm run test:ai:simple` (mock test, no API needed)

### Build fails
**Solution**:
```bash
# Install TypeScript
npm install --save-dev typescript

# Clean and rebuild
rm -rf packages/*/dist
npm run build
```

## 📊 Understanding Test Results

### ✅ All Pass
Everything works! You're ready to use UISchema.

### ⚠️ Some Skipped
Some tests were skipped (usually because dependencies aren't installed). This is OK for basic testing.

### ❌ Some Failed
Check the error messages:
- Build failures → Install TypeScript, rebuild
- API failures → Check API key, credits, network
- Validation failures → Check schema format

## 🎉 Success!

Once all tests pass:
1. ✅ UISchema is working correctly
2. ✅ AI integration is functional
3. ✅ Ready for development
4. ✅ Ready for production use

## Next Steps

- **Use in your project**: See `docs/getting-started.md`
- **Integrate with AI**: See `TESTING_WITH_AI.md`
- **API Reference**: See `docs/api-reference.md`
- **Examples**: Check `examples/` directory
