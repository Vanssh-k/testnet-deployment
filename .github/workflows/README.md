# Selective Deployment Workflow

This GitHub workflow provides selective deployment capabilities for your monorepo. It automatically detects changes in specific folders and only runs the corresponding deployment scripts.

## How it Works

The workflow uses the `dorny/paths-filter@v2` action to detect changes in specific directories and conditionally runs deployment jobs based on what has changed.

### Supported Services

The workflow monitors the following directories and their corresponding deployment jobs:

| Directory | Job Name | Description |
|-----------|----------|-------------|
| `upload/` | `deploy-upload` | Upload service deployment |
| `upload-node/` | `deploy-upload-node` | Upload node deployment (uses justfile) |
| `gateway-node/` | `deploy-gateway-node` | Gateway node deployment (uses justfile) |
| `kong/` | `deploy-kong` | Kong API gateway deployment (uses justfile) |
| `lighthouse-backend/` | `deploy-lighthouse-backend` | Lighthouse backend deployment |
| `pinning/` | `deploy-pinning` | Pinning service deployment |
| `cron-jobs/` | `deploy-cron-jobs` | Cron jobs deployment |
| `dht/` | `deploy-dht` | DHT service deployment |
| `cid-indexing/` | `deploy-cid-indexing` | CID indexing services deployment |
| `ipfs-ipni/` | `deploy-ipfs-ipni` | IPFS IPNI service deployment |
| `ipns-ipni/` | `deploy-ipns-ipni` | IPNS IPNI service deployment |

## Usage

### Automatic Deployment

1. Make changes to files in any of the monitored directories
2. Push to `main` or `master` branch
3. The workflow will automatically detect changes and run only the relevant deployment jobs

### Example Scenarios

**Scenario 1: Upload service changes**
- If you modify files in `upload/` directory
- Only the `deploy-upload` job will run
- Other services remain unaffected

**Scenario 2: Multiple service changes**
- If you modify files in both `upload/` and `gateway-node/` directories
- Both `deploy-upload` and `deploy-gateway-node` jobs will run
- Other services remain unaffected

**Scenario 3: No service changes**
- If you modify files outside the monitored directories (e.g., documentation)
- No deployment jobs will run

## Configuration

### Required Secrets

The workflow requires the following GitHub secrets to be configured:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: Your AWS region (e.g., `us-east-2`)

### Environment Variables

The workflow uses the following environment variables from your `.env` file:
- `AWS_SECRET_KEY`
- `AWS_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`

## Deployment Methods

### Docker-based Deployments

Most services use Docker-based deployments:
1. Build Docker image
2. Tag with ECR registry
3. Push to Amazon ECR

### Justfile-based Deployments

Some services use the existing justfile commands:
- `upload-node`: Uses `just deploy-kubo-private`
- `gateway-node`: Uses `just deploy-kubo-gateway`
- `kong`: Uses `just deploy-kong`

### Kubernetes Deployments

Some services deploy directly to Kubernetes:
- `lighthouse-backend`: Uses `kubectl apply -f ./lighthouse-backend/`

## Adding New Services

To add a new service to the selective deployment workflow:

1. Add a new filter in the `detect-changes` job:
   ```yaml
   your-service:
     - 'your-service/**'
   ```

2. Add a new output in the `detect-changes` job:
   ```yaml
   outputs:
     your-service-changed: ${{ steps.changes.outputs.your-service }}
   ```

3. Create a new deployment job:
   ```yaml
   deploy-your-service:
     needs: detect-changes
     if: needs.detect-changes.outputs.your-service-changed == 'true'
     runs-on: ubuntu-latest
     steps:
       # Your deployment steps here
   ```

## Troubleshooting

### Common Issues

1. **Job not running**: Check if the files you modified are in the correct directory
2. **Docker build failures**: Ensure your Dockerfile is in the service directory
3. **ECR push failures**: Verify AWS credentials are correctly configured
4. **Kubernetes deployment failures**: Ensure kubectl is configured for your cluster

### Debugging

To debug which jobs will run:
1. Check the workflow run logs
2. Look for the "Detect changes" step output
3. Verify the conditional logic in each job

## Benefits

- **Efficiency**: Only deploys services that have actually changed
- **Speed**: Reduces deployment time by avoiding unnecessary builds
- **Cost**: Reduces resource usage and costs
- **Reliability**: Reduces the risk of deploying unchanged services
- **Parallelization**: Multiple services can be deployed in parallel if they don't depend on each other 