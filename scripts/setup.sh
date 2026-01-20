#!/bin/bash

# UISchema Setup Script
# Verifies environment and sets up the project

set -e  # Exit on error

echo "🚀 UISchema Setup"
echo "=================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18 or higher is required. Current version: $(node --version)"
  exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Check npm version
echo ""
echo "📦 Checking npm version..."
NPM_VERSION=$(npm --version | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 9 ]; then
  echo "⚠️  npm 9 or higher is recommended. Current version: $(npm --version)"
else
  echo "✅ npm version: $(npm --version)"
fi

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
npm install

# Build packages
echo ""
echo "🔨 Building packages..."
npm run build

# Run tests
echo ""
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  - Read docs/getting-started.md for usage instructions"
echo "  - Check examples/ for code samples"
echo "  - Run 'npm run test:everything' for comprehensive testing"
echo ""
