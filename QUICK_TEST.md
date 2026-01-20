# Quick Test Guide

Fastest way to verify UISchema works.

## 1. Install & Build (2 minutes)

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Verify build output
npm run verify:build
```

**Expected**: All packages build successfully ✅

## 2. Run Smoke Test (30 seconds)

```bash
npm test
```

**Expected**: 
```
✅ Schema validation passed
✅ Component registry verified
✅ Shorthand expansion works
✅ Renderer works
Smoke test passed.
```

## 3. Run Full Test Suite (1 minute)

```bash
npm run test:all
```

**Expected**: All tests pass ✅

## 4. Test CLI (30 seconds)

```bash
# Validate example schema
npx @uischema/cli validate examples/hello-world/uischema.json
```

**Expected**:
```
✅ Schema validation passed
✅ Basic accessibility checks passed
📊 Schema compliance: 100%
```

## 5. Test Preview Server (optional)

```bash
# In one terminal
npx @uischema/cli preview

# In browser, open http://localhost:3000
# Expected: Preview interface loads
```

## 6. Test Next.js Example (2 minutes)

```bash
cd examples/nextjs-vercel-ai-sdk
npm install
npm run dev
```

**Expected**: 
- Server starts on http://localhost:3000
- Page loads
- "Generate UI" button works

## All Tests Pass? ✅

You're ready to use UISchema!

## Troubleshooting

### Build fails
```bash
# Clean and rebuild
rm -rf packages/*/dist node_modules
npm install
npm run build
```

### Tests fail
```bash
# Check specific package
npm run test:core
npm run test:compressed
# etc.
```

### CLI not found
```bash
# Build first
npm run build
# Then try again
npx @uischema/cli validate examples/hello-world/uischema.json
```
