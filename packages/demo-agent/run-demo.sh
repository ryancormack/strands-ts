#!/bin/bash

# Simple run script for the demos
# This ensures we're in the right directory

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if AWS credentials are configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "⚠️  AWS credentials not found!"
    echo ""
    echo "Please configure AWS credentials using one of these methods:"
    echo "  1. Run 'aws configure' to set up credentials"
    echo "  2. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    echo "  3. Set AWS_PROFILE to use a specific profile"
    echo "  4. Use IAM role (if running on AWS infrastructure)"
    echo ""
    exit 1
fi

# Display current AWS identity
echo "AWS Identity: $(aws sts get-caller-identity --query 'Arn' --output text)"
echo ""

# Run the demo menu
exec npx tsx src/index.ts "$@"