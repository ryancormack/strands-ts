# AWS Bedrock Setup Guide

This guide helps you set up AWS Bedrock to use with the Strands Agent SDK.

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **AWS CLI** (optional but recommended): Install from https://aws.amazon.com/cli/

## Step 1: Enable Bedrock Models

1. Log into AWS Console
2. Navigate to Amazon Bedrock
3. Go to "Model access" in the left sidebar
4. Request access to the models you want to use:
   - Claude 3 Sonnet (`us.anthropic.claude-3-7-sonnet-20250219-v1:0`)
   - Claude 3 Haiku (`us.anthropic.claude-3-haiku-20240307-v1:0`)
   - Amazon Nova models (if available in your region)

## Step 2: Configure AWS Credentials

### Option A: Environment Variables (Recommended for Development)

```bash
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
export AWS_REGION=us-west-2  # or your preferred region
```

### Option B: AWS CLI Configuration

```bash
aws configure
# Enter your credentials when prompted
```

### Option C: IAM Role (Recommended for Production)

If running on EC2, ECS, or Lambda, use IAM roles instead of credentials.

## Step 3: Verify Setup

Run this test script to verify your setup:

```bash
pnpm example:bedrock
```

## IAM Permissions

Your AWS user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*:*:foundation-model/*"
    }
  ]
}
```

## Supported Models

The SDK supports all Bedrock models that implement the Converse API:

### Anthropic Claude
- `us.anthropic.claude-3-7-sonnet-20250219-v1:0` (Default)
- `us.anthropic.claude-3-opus-20240229-v1:0`
- `us.anthropic.claude-3-haiku-20240307-v1:0`

### Amazon Nova
- `us.amazon.nova-micro-v1:0`
- `us.amazon.nova-lite-v1:0`
- `us.amazon.nova-pro-v1:0`

### Meta Llama
- `us.meta.llama3-3-70b-instruct-v1:0`
- `us.meta.llama3-2-11b-instruct-v1:0`

## Regional Availability

Not all models are available in all regions. Check the AWS documentation for model availability in your region.

Common regions with good model availability:
- `us-west-2` (Oregon) - Default
- `us-east-1` (Virginia)
- `eu-central-1` (Frankfurt)
- `ap-northeast-1` (Tokyo)

## Troubleshooting

### "Could not load credentials from any providers"
- Ensure AWS credentials are properly configured
- Check if AWS_PROFILE is set to a non-existent profile

### "Model not found"
- Verify you have requested access to the model
- Check if the model is available in your region
- Ensure the model ID is correct

### "Access denied"
- Check IAM permissions
- Verify the model access request was approved

## Cost Considerations

Bedrock charges per token for model usage. Monitor your usage in the AWS Cost Explorer to avoid unexpected charges.

Approximate costs (as of 2024):
- Claude 3 Sonnet: ~$3 per million input tokens
- Claude 3 Haiku: ~$0.25 per million input tokens
- Amazon Nova: Pricing varies by model tier