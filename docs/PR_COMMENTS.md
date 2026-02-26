# PR Comment Feature

This guide explains how to configure your GitHub Action to post comments on Pull Requests with rendered Helm charts.

## How It Works

When your workflow is triggered by a pull request event, the action will:
1. Extract values from your YAML file
2. Render the Helm chart using those values
3. Post a formatted comment on the PR with:
   - The extracted values (collapsible)
   - The rendered chart output (collapsible)

## Setup

### 1. Workflow Configuration

Create a workflow file (e.g., `.github/workflows/render-helm.yml`):

```yaml
name: Render Helm Chart on PR

on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - '**/*.yaml'
      - '**/*.yml'

permissions:
  contents: read
  pull-requests: write  # Required to post comments on PRs

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

      - name: Run Rudder Action
        uses: AndreasMoerch/rudder@main
        with:
          yaml-file: 'path/to/your/values.yaml'
          values-path: 'spec.source.helm.valuesObject'  # Optional
          chart-path: 'path/to/your/chart'
          release-name: 'my-release'  # Optional
          namespace: 'default'  # Optional
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Required Permissions

The workflow needs the `pull-requests: write` permission to post comments. The `GITHUB_TOKEN` is automatically provided by GitHub Actions.

### 3. Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `yaml-file` | Yes | - | Path to the YAML file containing values |
| `values-path` | No | - | Dot-notation path to extract nested values (e.g., `spec.source.helm.valuesObject`) |
| `chart-path` | Yes | - | Path to the Helm chart directory |
| `release-name` | No | `release` | Release name for Helm template rendering |
| `namespace` | No | - | Kubernetes namespace |

### 4. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | Provided automatically by GitHub Actions |

## Comment Format

The PR comment will be formatted as:

```markdown
## 🎯 Helm Chart Rendered

### Values Used
<details>
<summary>Click to expand values</summary>

[YAML values here]
</details>

### Rendered Output
<details>
<summary>Click to expand rendered chart (X lines)</summary>

[Rendered chart YAML here]
</details>
```

## Example PR Workflow

1. Developer creates a PR that modifies a YAML values file
2. GitHub Actions workflow is triggered
3. Action extracts values and renders the Helm chart
4. A formatted comment is posted on the PR showing:
   - What values were used
   - The complete rendered output
5. Reviewers can see exactly what will be deployed

## Local Testing

When running locally, the action detects it's not in a PR context and skips posting comments:

```bash
npm run build
npm run render
```

Output: `Not running in PR context, skipping comment`

## Troubleshooting

### Comment not appearing

Check that:
1. The workflow has `pull-requests: write` permission
2. `GITHUB_TOKEN` is provided in the `env` section
3. The workflow is triggered by a `pull_request` event

### Permission denied errors

Add the `permissions` block to your workflow:
```yaml
permissions:
  contents: read
  pull-requests: write
```

### Multiple comments on same PR

If you want to update an existing comment instead of creating new ones, you can modify the `commentOnPR` function in `src/github.ts` to:
1. Search for existing comments from the bot
2. Update that comment instead of creating a new one
