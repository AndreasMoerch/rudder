import * as core from '@actions/core';
import * as github from '@actions/github';
import { COMMENT_TEMPLATE } from './comment-template';

export interface GitHubContext {
    isPullRequest: boolean;
    prNumber?: number;
    repo: {
        owner: string;
        repo: string;
    };
}

/**
 * Get GitHub context information including PR details
 * @returns GitHub context with PR information if available
 */
export function getGitHubContext(): GitHubContext {
    const context = github.context;

    // Check if this is a pull request event
    const isPullRequest = context.eventName === 'pull_request' ||
                          context.eventName === 'pull_request_target' ||
                          (context.eventName === 'issue_comment' && !!context.payload.issue?.pull_request);

    let prNumber: number | undefined;

    if (isPullRequest) {
        if (context.payload.pull_request) {
            prNumber = context.payload.pull_request.number;
        } else if (context.payload.issue) {
            prNumber = context.payload.issue.number;
        }
    }

    return {
        isPullRequest,
        prNumber,
        repo: {
            owner: context.repo.owner,
            repo: context.repo.repo
        }
    };
}

/**
 * Post a comment on a GitHub Pull Request
 * @param prNumber The PR number to comment on
 * @param comment The comment body (supports Markdown)
 * @param token GitHub token (defaults to GITHUB_TOKEN from environment)
 */
export async function commentOnPR(
    prNumber: number,
    comment: string,
    token: string = process.env.GITHUB_TOKEN || ''
): Promise<void> {
    // Skip if not in GitHub Actions environment
    if (process.env.GITHUB_ACTIONS !== 'true') {
        console.warn('Not in GitHub Actions environment, skipping PR comment');
        return;
    }

    if (!token) {
        throw new Error('GITHUB_TOKEN is required to post PR comments');
    }

    const MAX_COMMENT_SIZE = 65000;
    if (comment.length > MAX_COMMENT_SIZE) {
        core.warning(`Rendered output too large for a PR comment (${comment.length} chars). Skipping comment.`);
        return;
    }

    const octokit = github.getOctokit(token);
    const context = github.context;

    try {
        await octokit.rest.issues.createComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: prNumber,
            body: comment
        });

        core.info(`Successfully posted comment on PR #${prNumber}`);
    } catch (error) {
        core.error(`Failed to post comment on PR #${prNumber}: ${error}`);
        throw error;
    }
}

/**
 * Format Helm output as a collapsible Markdown comment
 * @param helmOutput The rendered Helm chart YAML
 * @param valuesUsed The values that were used for rendering
 * @returns Formatted Markdown comment
 */
export function formatHelmComment(helmOutput: string, valuesUsed: string): string {
    return COMMENT_TEMPLATE
        .replace('{{lineCount}}', String(helmOutput.split('\n').length))
        .replace('{{helmOutput}}', helmOutput)
        .replace('{{valuesUsed}}', valuesUsed);
}
