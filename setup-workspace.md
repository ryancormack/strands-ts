# Workspace Setup Instructions

To complete the workspace setup, run these commands:

```bash
# 1. Move SDK files to packages/sdk
mkdir -p packages/sdk
mv src packages/sdk/
mv tsconfig.json packages/sdk/
mv migration.md packages/sdk/
mv docs packages/sdk/
mv test-*.ts packages/sdk/
mv test-*.sh packages/sdk/

# 2. Create SDK package.json
cp package.json packages/sdk/package.json

# 3. Replace root package.json
mv package.json.new package.json

# 4. Install dependencies
pnpm install

# 5. Build everything
pnpm build
```

## Workspace Structure

After setup, the structure will be:

```
strands-ts/
├── package.json (workspace root)
├── pnpm-workspace.yaml
├── packages/
│   ├── sdk/           # The main SDK package
│   │   ├── src/
│   │   ├── docs/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── demo-agent/    # Demo applications
│       ├── src/
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
```

## Running the Demos

After setup:

```bash
# Run the demo menu
pnpm demo

# Or run specific demos
pnpm --filter @strands/demo-agent run assistant
pnpm --filter @strands/demo-agent run weather
pnpm --filter @strands/demo-agent run calculator
```