import * as core from '@actions/core';
import { getGitHubContext, commentOnPR, formatHelmComment, formatErrorComment } from './github';
import { helmTemplate, HelmTemplateResult } from './utils/helm';
import { readYamlFile } from './utils/yaml';

/**
 * Reads the values file and returns its YAML content as a string array for helm -f flags.
 * If no file is provided, returns an empty array and the chart renders with its own defaults.
 * implNote: If no values file is passed, Helm will use the bundled Values file.
 * @param valuesFilePath - Optional path to a YAML values file.
 * @param valuesSelector - Optional dot-notation path to extract a nested object (e.g. spec.helm.values).
 */
async function resolveValues(valuesFilePath?: string, valuesSelector?: string): Promise<string[]> {
    if (!valuesFilePath) {
        core.info('No values file provided, rendering chart with defaults');
        return [];
    }
    core.info(`Reading YAML file: ${valuesFilePath}`);
    const yamlValue = await readYamlFile(valuesFilePath, { valuesPath: valuesSelector || undefined });
    core.setOutput('extracted-values', yamlValue.output);
    core.info('Extracted values from YAML file');
    return [yamlValue.output];
}

/**
 * Runs helm template with the resolved values and returns the rendered output.
 * Also sets the rendered-yaml action output for downstream steps.
 * @param chartPath - Path or reference to the Helm chart.
 * @param values - Array of YAML value strings to pass as -f flags.
 * @param releaseName - Helm release name.
 * @param namespace - Kubernetes namespace.
 */
async function renderChart(chartPath: string, values: string[], releaseName?: string, namespace?: string): Promise<HelmTemplateResult> {
    core.info(`Rendering Helm chart: ${chartPath}`);
    const result = await helmTemplate(chartPath, {
        values: values,
        releaseName: releaseName,
        namespace: namespace,
    });
    core.setOutput('rendered-yaml', result.output);
    core.info('Successfully rendered Helm chart');
    return result;
}

/**
 * Posts the rendered Helm chart as a formatted comment on the PR.
 * No-ops if not running in a pull request context.
 * @param renderedYaml - The rendered Helm chart output.
 * @param values - The values used for rendering, shown in the comment.
 */
async function postComment(renderedYaml: string, values: string[]): Promise<void> {
    const githubContext = getGitHubContext();
    if (!githubContext.isPullRequest || !githubContext.prNumber) {
        core.info('Not running in PR context, skipping comment');
        return;
    }
    core.info(`Detected PR #${githubContext.prNumber}, posting comment...`);
    const comment = formatHelmComment(renderedYaml, values[0] ?? '(chart defaults)');
    await commentOnPR(githubContext.prNumber, comment);
}

/**
 * Posts the error as a comment on the PR so it is visible without digging into GHA logs.
 * Failures are swallowed to avoid masking the original error.
 * @param error - The error that caused the action to fail.
 */
async function postErrorComment(error: Error): Promise<void> {
    try {
        const githubContext = getGitHubContext();
        if (githubContext.isPullRequest && githubContext.prNumber) {
            await commentOnPR(githubContext.prNumber, formatErrorComment(error.message));
        }
    } catch {
        // Swallow — don't obscure the original error
    }
}

/**
 * Main entry point for GitHub Action execution.
 * Reads action inputs, renders the Helm chart, and posts the result as a PR comment.
 * On failure, posts the error as a PR comment before re-throwing.
 */
export async function runAction(): Promise<void> {
    try {
        const valuesFilePath = core.getInput('values-file');
        const valuesSelector = core.getInput('values-selector');
        const chartPath = core.getInput('chart-path', { required: true });
        const releaseName = core.getInput('release-name') || 'release';
        const namespace = core.getInput('namespace');

        const values = await resolveValues(valuesFilePath, valuesSelector);
        const result = await renderChart(chartPath, values, releaseName, namespace);
        await postComment(result.output, values);

    } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error occurred');
        core.setFailed(err.message);
        await postErrorComment(err);
        throw error;
    }
}
