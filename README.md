# rudder

Rudder is a simple Helm chart rendering machine that helps you uncover bugs with rendered charts before applying them to Kubernetes.

## Features

- **Extract values** from YAML files with optional dot-notation path support
- **Render Helm charts** using extracted values
- **Automatic PR comments** with rendered output when running in pull request context
- **Collapsible output** for easy review of values and rendered manifests

## Usage as GitHub Action

### Basic Example

```yaml
- uses: AndreasMoerch/rudder@main
  with:
    yaml-file: 'path/to/values.yaml'
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
          yaml-file: 'example/values.yaml'
          values-path: 'spec.source.helm.valuesObject'
          chart-path: 'example/chart'
          release-name: 'my-release'
          namespace: 'default'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `yaml-file` | Yes | - | Path to the YAML file containing values |
| `values-path` | No | - | Dot-notation path to extract nested values (e.g., `spec.source.helm.valuesObject`) |
| `chart-path` | Yes | - | Path to the Helm chart directory |
| `release-name` | No | `release` | Release name for Helm template rendering |
| `namespace` | No | - | Kubernetes namespace for template rendering |

### Outputs

| Output | Description |
|--------|-------------|
| `rendered-yaml` | The rendered Helm chart YAML output |
| `extracted-values` | The values extracted from the YAML file |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes (for PR comments) | Provided automatically by GitHub Actions |

## PR Comments

When running in a pull request context, Rudder automatically posts a comment with:
- The extracted values (collapsible)
- The full rendered chart output (collapsible)

See [PR_COMMENTS.md](docs/PR_COMMENTS.md) for more details.

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
node dist/index.js
```


