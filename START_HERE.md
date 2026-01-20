# 🚀 Start Here - Testing UISchema

**Quick start guide to test everything works.**

## Step-by-Step Testing

### Step 1: Verify File Structure (30 seconds)
```bash
npm run test:simple
```

**Expected**: All file structure tests pass ✅

### Step 2: Install Dependencies
```bash
npm install
```

**Note**: If you get "workspace:* protocol not supported", you have two options:

**Option A**: Use pnpm (recommended)
```bash
npm install -g pnpm
pnpm install
```

**Option B**: Install manually
```bash
# Install root deps
npm install

# Install each package
cd packages/uischema-core && npm install && cd ../..
cd packages/uischema-compressed && npm install && cd ../..
cd packages/uischema-bridges && npm install && cd ../..
cd packages/uischema-protocol && npm install && cd ../..
cd packages/uischema-react && npm install && cd ../..
cd packages/uischema-cli && npm install && cd ../..
```

### Step 3: Build All Packages
```bash
npm run build
```

**If TypeScript not found**:
```bash
npm install --save-dev typescript
npm run build
```

**Expected**: All packages compile successfully ✅

### Step 4: Verify Build Output
```bash
npm run verify:build
```

**Expected**: All packages have dist/ output ✅

### Step 5: Run Smoke Tests
```bash
npm test
```

**Expected**: Smoke test passes ✅

### Step 6: Run Full Test Suite
```bash
npm run test:all
```

**Expected**: All tests pass ✅

### Step 7: Test CLI
```bash
npx @uischema/cli validate examples/hello-world/uischema.json
```

**Expected**: Validation passes ✅

### Step 8: Test AI Integration
```bash
# Test with mock AI responses
npm run test:ai

# Or simple version
npm run test:ai:simple
```

**Expected**: All AI integration tests pass ✅

**Next**: Test with real AI (see `TESTING_WITH_AI.md`)

## Quick Test Script

Run this to test everything at once:

```bash
# 1. File structure
npm run test:simple

# 2. Build
npm run build

# 3. Verify build
npm run verify:build

# 4. Smoke test
npm test

# 5. Full test suite
npm run test:all

# 6. CLI test
npx @uischema/cli validate examples/hello-world/uischema.json
```

## Troubleshooting

### "Module not found" errors
**Solution**: Build packages first
```bash
npm run build
```

### "workspace:* protocol not supported"
**Solution**: Use pnpm or install manually (see Step 2)

### "tsc: command not found"
**Solution**: Install TypeScript
```bash
npm install --save-dev typescript
```

### Tests fail after build
**Solution**: Check if packages built correctly
```bash
npm run verify:build
ls packages/*/dist/
```

## Success Checklist

- [ ] File structure tests pass
- [ ] Dependencies installed
- [ ] All packages build
- [ ] Build output verified
- [ ] Smoke tests pass
- [ ] Full test suite passes
- [ ] CLI tools work

## Next Steps

Once all tests pass:
1. ✅ Ready to use UISchema
2. ✅ Ready to integrate
3. ✅ Ready for development

## Detailed Guides

- **Quick Test**: See `QUICK_TEST.md`
- **Full Testing Guide**: See `TESTING_GUIDE.md`
- **How to Test**: See `HOW_TO_TEST.md`
