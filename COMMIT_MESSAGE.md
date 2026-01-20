feat: Make repository production-ready with comprehensive documentation and fixes

This commit transforms UISchema into a production-ready, clone-and-use repository
with zero bugs/warnings, comprehensive documentation, and easy setup process.

## Bug Fixes

- Fix TypeScript errors in CLI package (ESM/CommonJS conflicts)
  - Convert CLI to pure CommonJS for maximum compatibility
  - Resolve redeclaration errors by using proper module.exports pattern
  - Fix all TypeScript compilation errors

- Fix all TypeScript warnings
  - Remove implicit `any` types
  - Add explicit type annotations
  - Fix HTTP types in preview command

- Fix package exports
  - Add proper `exports` fields to all packages
  - Support both ESM and CommonJS imports
  - Ensure type definitions are properly exported

## Documentation

- Enhance main README
  - Add clear "Clone and Use" section
  - Add architecture diagram with mermaid
  - Improve quick start with complete example
  - Add comprehensive documentation index

- Enhance Getting Started guide
  - Add prerequisites checklist
  - Add step-by-step setup instructions
  - Add troubleshooting section
  - Add next steps with links

- Create new documentation guides
  - Component Catalog Guide (docs/component-catalog.md)
  - Streaming UI Guide (docs/streaming-ui.md)
  - Code Export Guide (docs/export-as-code.md)

- Enhance Architecture documentation
  - Add mermaid diagrams for data flow
  - Add component relationships diagram
  - Add protocol flow sequence diagram

- Create Contributing Guide (CONTRIBUTING.md)
  - Development setup instructions
  - Code style guidelines
  - Pull request process
  - Testing requirements

## Infrastructure

- Add setup script (scripts/setup.sh)
  - Environment verification (Node.js, npm)
  - Automated dependency installation
  - Build and test execution

- Add GitHub Actions CI workflow (.github/workflows/ci.yml)
  - Test on multiple Node.js versions
  - Build verification
  - Type checking
  - Example build verification

- Add environment example (.env.example)
  - OpenAI API key configuration
  - Optional AI provider settings
  - Clear comments and instructions

- Add package scripts
  - `clean`: Remove build artifacts
  - `prebuild`: Auto-clean before build
  - `type-check`: TypeScript type checking

## Verification

- All TypeScript errors fixed (zero errors)
- All TypeScript warnings fixed (zero warnings)
- All tests passing
- Build system working correctly
- Package exports verified

## Files Changed

### Modified
- README.md - Enhanced with clone instructions and diagrams
- docs/getting-started.md - Comprehensive setup guide
- docs/architecture.md - Added mermaid diagrams
- packages/uischema-cli/src/**/*.ts - Fixed CommonJS/ESM issues
- packages/*/package.json - Added proper exports
- package.json - Added clean and type-check scripts

### Created
- docs/component-catalog.md
- docs/streaming-ui.md
- docs/export-as-code.md
- CONTRIBUTING.md
- scripts/setup.sh
- .github/workflows/ci.yml
- .env.example

## Breaking Changes

None - all changes are backward compatible.

## Testing

- ✅ Build passes with zero errors
- ✅ Type-check passes with zero warnings
- ✅ All existing tests pass
- ✅ Test suite runs successfully
- ✅ Examples build correctly

## Next Steps

Repository is now ready for:
- Public release on GitHub
- Easy cloning and setup by new users
- Contribution from community
- CI/CD automation
