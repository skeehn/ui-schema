# UISchema Testing Guide

Complete guide to test and verify the UISchema implementation.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build all packages
npm run build

# 3. Run smoke tests
npm test

# 4. Run comprehensive test suite
npm run test:all
```

## Test Categories

### 1. Build Tests
Verify all packages compile correctly.

```bash
npm run build
```

**Expected**: All TypeScript packages compile without errors.

### 2. Smoke Tests
Basic functionality verification.

```bash
npm test
# or
npm run smoke
```

**Tests**:
- Schema validation
- Accessibility checks
- Component registry
- Shorthand expansion
- React rendering

### 3. Package-Specific Tests

#### Core Package Tests
```bash
npm run test:core
```

**Tests**:
- JSON Schema validation
- Zod validators
- TypeScript types
- Basic accessibility constraints

#### Compressed Package Tests
```bash
npm run test:compressed
```

**Tests**:
- Shorthand parsing
- Expansion engine
- Coarse-to-fine pipeline
- Token reduction

#### Bridges Package Tests
```bash
npm run test:bridges
```

**Tests**:
- Open-JSON-UI conversion
- AG-UI event mapping
- MCP Apps message format

#### Protocol Package Tests
```bash
npm run test:protocol
```

**Tests**:
- Patch operations
- Event serialization
- State management

#### React Package Tests
```bash
npm run test:react
```

**Tests**:
- Component rendering
- useUIStream hook
- DX-first API
- Component registry

#### CLI Tests
```bash
npm run test:cli
```

**Tests**:
- Validation command
- Preview server
- Type generation

### 4. Integration Tests
```bash
npm run test:integration
```

**Tests**:
- End-to-end schema → render flow
- Streaming updates
- Event handling
- State synchronization

### 5. Manual Testing

#### Test CLI Validation
```bash
# Validate example schema
npx @uischema/cli validate examples/hello-world/uischema.json

# Expected: ✅ Schema validation passed
# Expected: ✅ Basic accessibility checks passed
```

#### Test Preview Server
```bash
# Start preview server
npx @uischema/cli preview 3000

# Open http://localhost:3000
# Expected: Preview interface loads
# Expected: Can edit JSON and see preview
```

#### Test Type Generation
```bash
# Generate types
npx @uischema/cli generate-types test-types.ts

# Expected: test-types.ts created
# Expected: test-types-schema.json created
```

#### Test Next.js Example
```bash
cd examples/nextjs-vercel-ai-sdk
npm install
npm run dev

# Open http://localhost:3000
# Click "Generate UI"
# Expected: UI renders correctly
```

## Detailed Test Scenarios

### Scenario 1: Basic Schema Validation

**Test File**: `examples/hello-world/uischema.json`

```bash
npx @uischema/cli validate examples/hello-world/uischema.json
```

**Expected Results**:
- ✅ Schema validation passed
- ✅ Basic accessibility checks passed
- 📊 Schema compliance: 100%

### Scenario 2: Shorthand Expansion

**Test Code**:
```javascript
const { expandShorthand } = require('@uischema/compressed');
const node = expandShorthand('c[ariaLabel:Test][children:txt[text:Hello]]');
console.log(JSON.stringify(node, null, 2));
```

**Expected**: Valid UISchema node with Container and Text children.

### Scenario 3: React Rendering

**Test Code**:
```tsx
import { UISchemaRenderer } from '@uischema/react';
import schema from './uischema.json';

<UISchemaRenderer schema={schema} />
```

**Expected**: Renders React elements without errors.

### Scenario 4: Streaming Updates

**Test Code**:
```tsx
import { useUIStream } from '@uischema/react';

const { schema, loading, error } = useUIStream({
  endpoint: '/api/stream-ui',
  initialSchema: initialSchema
});
```

**Expected**: Hook manages state correctly, handles streaming.

### Scenario 5: Patch Operations

**Test Code**:
```javascript
const { applyPatches, createSetPatch } = require('@uischema/protocol');
const updated = applyPatches(rootNode, [
  createSetPatch('/props/text', 'Updated')
]);
```

**Expected**: Node updated correctly.

### Scenario 6: Spec Bridges

**Test Code**:
```javascript
const { fromOpenJSONUIDocument } = require('@uischema/bridges');
const uischema = fromOpenJSONUIDocument(openJsonUIDoc);
```

**Expected**: Valid UISchema document.

## Test Checklist

### Core Functionality
- [ ] Schema validation works
- [ ] Zod validators catch errors
- [ ] Accessibility constraints enforced
- [ ] TypeScript types compile

### Compressed Representation
- [ ] Shorthand parsing works
- [ ] Expansion produces valid schema
- [ ] Coarse-to-fine pipeline works
- [ ] Token reduction achieved

### Spec Bridges
- [ ] Open-JSON-UI → UISchema conversion
- [ ] UISchema → Open-JSON-UI conversion
- [ ] AG-UI event mapping
- [ ] MCP Apps message format

### Protocol Layer
- [ ] Patch operations work
- [ ] JSONL parsing works
- [ ] Event serialization works
- [ ] State management works

### React Adapter
- [ ] Components render correctly
- [ ] useUIStream hook works
- [ ] DX-first API works
- [ ] Component registry works

### CLI Tools
- [ ] Validation command works
- [ ] Preview server starts
- [ ] Type generation works

### Examples
- [ ] Hello World example works
- [ ] Next.js example builds
- [ ] Next.js example runs

## Troubleshooting

### Build Errors
```bash
# Clean and rebuild
rm -rf packages/*/dist
npm run build
```

### Module Resolution Errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Type Errors
```bash
# Check TypeScript config
npx tsc --noEmit
```

### Test Failures
```bash
# Run with verbose output
npm test -- --verbose
```

## Performance Testing

### Token Reduction Benchmark
```bash
npm run test:benchmark
```

**Expected**: 3-5x token reduction with shorthand.

### Rendering Performance
```bash
npm run test:performance
```

**Expected**: Fast rendering (<100ms for typical schemas).

## Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm install

- name: Build packages
  run: npm run build

- name: Run tests
  run: npm run test:all

- name: Validate examples
  run: npx @uischema/cli validate examples/hello-world/uischema.json
```

## Next Steps

After passing all tests:
1. ✅ Verify all packages build
2. ✅ Run smoke tests
3. ✅ Test CLI tools
4. ✅ Test examples
5. ✅ Verify documentation
6. ✅ Ready for production use!
