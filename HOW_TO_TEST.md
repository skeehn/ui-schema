# How to Test UISchema - Complete Guide

Step-by-step guide to fully test and verify the UISchema implementation.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Step 1: Install Dependencies

### Option A: Using npm (if workspace protocol supported)
```bash
npm install
```

### Option B: Using pnpm (recommended for workspaces)
```bash
# Install pnpm if not installed
npm install -g pnpm

# Install dependencies
pnpm install
```

### Option C: Manual installation
If workspace protocol doesn't work, install dependencies manually:

```bash
# Install root dependencies
npm install

# Install package dependencies
cd packages/uischema-core && npm install && cd ../..
cd packages/uischema-compressed && npm install && cd ../..
cd packages/uischema-bridges && npm install && cd ../..
cd packages/uischema-protocol && npm install && cd ../..
cd packages/uischema-react && npm install && cd ../..
cd packages/uischema-cli && npm install && cd ../..
```

## Step 2: Build All Packages

```bash
# Build TypeScript packages
npm run build

# Or if TypeScript not found globally:
npx tsc -b

# Verify build output
npm run verify:build
```

**Expected Output**:
```
✅ uischema-core: Build output verified
✅ uischema-compressed: Build output verified
✅ uischema-bridges: Build output verified
✅ uischema-protocol: Build output verified
✅ uischema-react: Build output verified
✅ uischema-cli: Build output verified
```

## Step 3: Run Smoke Tests

```bash
npm test
```

**Expected Output**:
```
✅ Schema validation passed
✅ Component registry verified
✅ Shorthand expansion works
✅ Renderer works
Smoke test passed.
```

## Step 4: Run Comprehensive Test Suite

```bash
npm run test:all
```

**Expected Output**:
```
📦 Testing @uischema/core
✅ Schema validation
✅ Accessibility validation
✅ Type exports

📦 Testing @uischema/compressed
✅ Shorthand parsing
✅ Shorthand expansion
✅ Coarse-to-fine pipeline

📦 Testing @uischema/bridges
✅ Open-JSON-UI conversion
✅ AG-UI event mapping
✅ MCP Apps message format

📦 Testing @uischema/protocol
✅ Patch operations
✅ JSONL patch parsing
✅ Event serialization
✅ State management

📦 Testing @uischema/react
✅ Component registry
✅ Renderer exports
✅ DX-first API

🔗 Testing Integration
✅ End-to-end: Schema → Render
✅ Shorthand → Expand → Render

📊 Test Results:
✅ Passed: 15
❌ Failed: 0

🎉 All tests passed!
```

## Step 5: Test CLI Tools

### Test Validation Command
```bash
npx @uischema/cli validate examples/hello-world/uischema.json
```

**Expected Output**:
```
✅ Schema validation passed
✅ Basic accessibility checks passed
📊 Schema compliance: 100%
```

### Test Preview Server
```bash
# Start server
npx @uischema/cli preview 3000

# Open http://localhost:3000 in browser
# Expected: Preview interface with JSON editor
```

### Test Type Generation
```bash
npx @uischema/cli generate-types test-types.ts
```

**Expected Output**:
```
✅ TypeScript types generated: test-types.ts
✅ JSON Schema snippet generated: test-types-schema.json
💡 Use this JSON Schema with OpenAI structured outputs or Llama JSON mode
```

## Step 6: Test Individual Packages

### Test Core Package
```bash
node -e "const { UISchemaDocumentSchema } = require('@uischema/core'); console.log('✅ Core package works')"
```

### Test Compressed Package
```bash
node -e "const { expandShorthand } = require('@uischema/compressed'); const n = expandShorthand('c[ariaLabel:Test]'); console.log('✅ Compressed package works:', n.type)"
```

### Test Bridges Package
```bash
node -e "const { fromOpenJSONUIDocument } = require('@uischema/bridges'); console.log('✅ Bridges package works')"
```

### Test Protocol Package
```bash
node -e "const { applyPatches } = require('@uischema/protocol'); console.log('✅ Protocol package works')"
```

### Test React Package
```bash
node -e "const { getRegistrySnapshot } = require('@uischema/react'); const r = getRegistrySnapshot(); console.log('✅ React package works:', Object.keys(r).length, 'components')"
```

## Step 7: Test Next.js Example

```bash
cd examples/nextjs-vercel-ai-sdk

# Install dependencies
npm install

# Build (if needed)
npm run build

# Start dev server
npm run dev
```

**Expected**:
- Server starts on http://localhost:3000
- Page loads with "Generate UI" button
- Clicking button generates and renders UI

## Step 8: Manual Verification Checklist

### Core Functionality
- [ ] Schema validation works (`npm test`)
- [ ] Accessibility checks work
- [ ] TypeScript types compile
- [ ] All packages build

### Compressed Representation
- [ ] Shorthand parsing works
- [ ] Expansion produces valid schema
- [ ] Coarse-to-fine pipeline works

### Spec Bridges
- [ ] Open-JSON-UI conversion works
- [ ] AG-UI event mapping works
- [ ] MCP Apps message format works

### Protocol Layer
- [ ] Patch operations work
- [ ] JSONL parsing works
- [ ] Event serialization works
- [ ] State management works

### React Adapter
- [ ] Components render
- [ ] useUIStream hook works
- [ ] DX-first API works
- [ ] Component registry works

### CLI Tools
- [ ] Validation command works
- [ ] Preview server starts
- [ ] Type generation works

## Troubleshooting

### Issue: "workspace:* protocol not supported"
**Solution**: Use pnpm or install dependencies manually (see Step 1, Option C)

### Issue: "tsc: command not found"
**Solution**: 
```bash
# Install TypeScript locally
npm install --save-dev typescript

# Or use npx
npx tsc -b
```

### Issue: "Module not found" errors
**Solution**:
```bash
# Rebuild packages
npm run build

# Or reinstall
rm -rf node_modules packages/*/node_modules
npm install
```

### Issue: Tests fail
**Solution**:
```bash
# Run individual test
npm run test:core

# Check specific package
cd packages/uischema-core
npm test
```

### Issue: CLI not found
**Solution**:
```bash
# Build first
npm run build

# Use full path
node packages/uischema-cli/dist/cli.js validate examples/hello-world/uischema.json
```

## Quick Test Script

Save this as `quick-test.sh`:

```bash
#!/bin/bash
set -e

echo "🔨 Building packages..."
npm run build

echo "✅ Running smoke tests..."
npm test

echo "🧪 Running full test suite..."
npm run test:all

echo "🔍 Testing CLI..."
npx @uischema/cli validate examples/hello-world/uischema.json

echo "🎉 All tests passed!"
```

Make it executable and run:
```bash
chmod +x quick-test.sh
./quick-test.sh
```

## Success Criteria

All tests pass when:
- ✅ All packages build successfully
- ✅ Smoke tests pass
- ✅ Comprehensive test suite passes
- ✅ CLI tools work
- ✅ Next.js example runs
- ✅ No TypeScript errors
- ✅ No runtime errors

## Next Steps

Once all tests pass:
1. ✅ Ready for development use
2. ✅ Ready for integration
3. ✅ Ready for production (after additional testing)

## Need Help?

- Check `TESTING_GUIDE.md` for detailed scenarios
- Check `QUICK_TEST.md` for fastest verification
- Review package-specific README files
- Check build output in `packages/*/dist/`
