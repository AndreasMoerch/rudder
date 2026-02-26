import * as core from '@actions/core';
import { getGitHubContext, commentOnPR, formatHelmComment } from './github';
import { helmTemplate } from './utils/helm';
import { readYamlFile } from './utils/yaml';

/**
 * Main entry point for GitHub Action execution
 * Handles input/output, PR detection, and commenting
 */
export async function runAction(): Promise<void> {
    try {
        // Get inputs from GitHub Action
        const yamlFilePath = core.getInput('yaml-file', { required: true });
        const valuesPath = core.getInput('values-path');
        const chartPath = core.getInput('chart-path', { required: true });
        const releaseName = core.getInput('release-name') || 'release';
        const namespace = core.getInput('namespace');

        core.info(`Reading YAML file: ${yamlFilePath}`);
        const yamlValue = await readYamlFile(yamlFilePath, {
            valuesPath: valuesPath || undefined
        });

        core.setOutput('extracted-values', yamlValue.output);
        core.info('Extracted values from YAML file');

        core.info(`Rendering Helm chart: ${chartPath}`);
        const result = await helmTemplate(chartPath, {
            values: [yamlValue.output],
            releaseName,
            namespace: namespace || undefined
        });

        core.setOutput('rendered-yaml', result.output);
        core.info('Successfully rendered Helm chart');

        // Check if running in PR context and post comment
        const githubContext = getGitHubContext();
        if (githubContext.isPullRequest && githubContext.prNumber) {
            core.info(`Detected PR #${githubContext.prNumber}, posting comment...`);

            const comment = formatHelmComment(result.output, yamlValue.output);
            await commentOnPR(githubContext.prNumber, comment);
        } else {
            core.info('Not running in PR context, skipping comment');
        }

    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed('Unknown error occurred');
        }
        throw error;
    }
}
