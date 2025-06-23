#!/bin/bash
# Quick build script for first-time setup

echo "🔨 Building Strands Agent SDK..."
pnpm build

echo "✅ Build complete!"
echo ""
echo "You can now run the demos:"
echo "  pnpm demo          # Interactive demo menu"
echo "  pnpm dev:demo      # Same as above"
echo ""
echo "Or run individual demos:"
echo "  pnpm --filter @strands/demo-agent assistant"
echo "  pnpm --filter @strands/demo-agent weather"
echo "  pnpm --filter @strands/demo-agent calculator"