# Contributing to UISchema

Thank you for your interest in contributing to UISchema! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd uischema
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build packages**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

### Running the Setup Script

For automated setup:

```bash
bash scripts/setup.sh
```

This will verify your environment, install dependencies, build packages, and run tests.

## Code Style

### TypeScript

- Use TypeScript for all new code
- Follow existing code patterns
- Avoid `any` types when possible
- Use explicit return types for functions
- Enable strict mode checks

### Naming Conventions

- **Files**: Use kebab-case (e.g., `validate-command.ts`)
- **Functions**: Use camelCase (e.g., `validateCommand`)
- **Types/Interfaces**: Use PascalCase (e.g., `UISchemaNode`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_DEPTH`)

### File Structure

```
packages/
  uischema-{name}/
    src/
      index.ts          # Main exports
      types.ts          # Type definitions
      validators/       # Validation logic
      ...
    package.json
    tsconfig.json
```

## Pull Request Process

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

Examples:
```
feat(core): add support for custom components
fix(react): resolve streaming hook memory leak
docs(readme): update installation instructions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Updated documentation

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process

1. **Self-Review**: Review your own PR before requesting review
2. **Tests**: Ensure all tests pass
3. **Documentation**: Update docs if needed
4. **CI**: Wait for CI to pass
5. **Address Feedback**: Respond to review comments

## Testing Requirements

### Unit Tests

Write unit tests for:
- New functions
- Bug fixes
- Edge cases
- Error handling

### Integration Tests

Test integration between:
- Packages
- External dependencies
- API endpoints

### Running Tests

```bash
# All tests
npm test

# Specific test suite
npm run test:core
npm run test:react

# AI integration tests (requires API key)
npm run test:openai
npm run test:vercel-ai

# Everything
npm run test:everything
```

### Test Coverage

- Aim for >80% coverage
- Focus on critical paths
- Test error cases

## Release Process

### Versioning

Follow semantic versioning:
- `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes

### Changelog

Update `CHANGELOG.md` with:
- New features
- Bug fixes
- Breaking changes
- Deprecations

### Publishing

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Push to repository
5. Publish to npm (if applicable)

## Getting Help

- **Documentation**: Check `docs/` directory
- **Examples**: See `examples/` directory
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Follow project guidelines

Thank you for contributing to UISchema! 🎉
