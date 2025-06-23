#!/bin/bash
# Script to reorganize the workspace structure

echo "📦 Reorganizing workspace structure..."

# Move SDK source to packages/sdk
echo "Moving SDK source files..."
mv src packages/sdk/

# Move SDK-related files
echo "Moving SDK configuration files..."
mv docs packages/sdk/ 2>/dev/null || true
mv migration.md packages/sdk/ 2>/dev/null || true
mv test-*.ts packages/sdk/ 2>/dev/null || true
mv test-*.sh packages/sdk/ 2>/dev/null || true

# Update root package.json
echo "Updating root package.json..."
mv package.json package.json.old
mv workspace-package.json package.json

echo "✅ Workspace reorganization complete!"
echo ""
echo "New structure:"
echo "  packages/"
echo "    ├── sdk/          # The main SDK package"
echo "    │   └── src/      # SDK source code"
echo "    └── demo-agent/   # Demo applications"
echo ""
echo "Next steps:"
echo "1. Run: pnpm install"
echo "2. Build SDK: pnpm build:sdk"
echo "3. Run demos: pnpm demo"