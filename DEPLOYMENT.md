# 🚀 Deployment Guide

## GitHub Container Registry (ghcr.io)

### Automatic Deployment

The project uses GitHub Actions for automatic deployment:

1. **On Push to main**: Builds and pushes `latest` tag
2. **On Version Tag**: Builds and pushes versioned tags (e.g., `v2.0.0`)
3. **Multi-platform**: Supports `linux/amd64` and `linux/arm64`

### Manual Deployment

```bash
# 1. Build the image
docker build -t mcp-astronomical-time-server .

# 2. Tag for ghcr.io
docker tag mcp-astronomical-time-server ghcr.io/YOUR_USERNAME/mcp-astronomical-time-server:latest
docker tag mcp-astronomical-time-server ghcr.io/YOUR_USERNAME/mcp-astronomical-time-server:v2.0.0

# 3. Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 4. Push images
docker push ghcr.io/YOUR_USERNAME/mcp-astronomical-time-server:latest
docker push ghcr.io/YOUR_USERNAME/mcp-astronomical-time-server:v2.0.0
```

### Package Visibility

After first push, make the package public:

1. Go to your GitHub profile → Packages
2. Click on `mcp-astronomical-time-server`
3. Package settings → Change visibility → Public

## Security Considerations

✅ **Production Ready Features**:
- Non-root user execution
- Minimal Alpine Linux base
- Multi-stage build (small image size)
- Health checks
- Vulnerability scanning (Trivy)
- Dependabot updates
- Rate limiting & DDoS protection

## Versioning

Follow semantic versioning:
- `vMAJOR.MINOR.PATCH`
- Tag releases: `git tag v2.0.1 && git push origin v2.0.1`

## Testing Production Image

```bash
# Pull and test
docker pull ghcr.io/YOUR_USERNAME/mcp-astronomical-time-server:latest

# Quick test
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | \
  docker run -i --rm ghcr.io/YOUR_USERNAME/mcp-astronomical-time-server:latest

# Full test suite
./quick-test.sh
```

## Monitoring

- GitHub Actions: Check workflow runs
- Security tab: View vulnerability scans
- Insights → Dependency graph: Track dependencies