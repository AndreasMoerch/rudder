# rudder

Rudder is a simple Helm chart rendering machine that helps you uncover bugs with rendered charts before applying them to Kubernetes.

## Features

- **Render Helm charts** against a values file and post the result as a PR comment
- **Extract nested values** from YAML files using dot-notation selectors
- **Automatic PR comments** with rendered output when running in pull request context
- **Collapsible output** for easy review of values and rendered manifests

## Usage as GitHub Action

### Basic Example

```yaml
- uses: AndreasMoerch/rudder@main
  with:
    values-file: 'path/to/values.yaml'
    chart-path: 'path/to/chart'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Full Workflow Example

```yaml
name: Render Helm Chart on PR

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  render-helm:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Helm
        uses: azure/setup-helm@v4
        with:
          version: 'latest'

      - name: Render Helm chart
        uses: AndreasMoerch/rudder@main
        with:
          values-file: 'example/values.yaml'
          values-selector: 'spec.source.helm.valuesObject'
          chart-path: 'example/chart'
          release-name: 'my-release'
          namespace: 'default'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `values-file` | No | - | Path to the YAML values file. If omitted, the chart's own `values.yaml` is used |
| `values-selector` | No | - | Dot-notation path to extract nested values (e.g., `spec.source.helm.valuesObject`) |
| `chart-path` | Yes | - | Path to the Helm chart directory |
| `release-name` | No | `release` | Release name for Helm template rendering |
| `namespace` | No | - | Kubernetes namespace for template rendering |

### Outputs

| Output | Description |
|--------|-------------|
| `rendered-yaml` | The rendered Helm chart YAML output |
| `extracted-values` | The values extracted from the values file |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes (for PR comments) | Provided automatically by GitHub Actions |

## PR Comments

When running in a pull request context, Rudder automatically posts a comment with:
- The values used for rendering (collapsible)
- The full rendered chart output (collapsible)

If rendering fails, the error is posted as a PR comment so it is visible without digging into the GHA logs.

## Development

This is a TypeScript-based GitHub Action.

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Run locally

```bash
# Use example defaults
node dist/index.js

# With a custom values file
node dist/index.js --values-file example/values.yaml --chart-path example/chart

# All options
node dist/index.js --values-file example/values.yaml --values-selector spec.helm.values --chart-path example/chart --release-name my-release --namespace default
```
