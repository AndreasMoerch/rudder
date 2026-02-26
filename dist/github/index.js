"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitHubContext = getGitHubContext;
exports.commentOnPR = commentOnPR;
exports.formatHelmComment = formatHelmComment;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Get GitHub context information including PR details
 * @returns GitHub context with PR information if available
 */
function getGitHubContext() {
    const context = github.context;
    // Check if this is a pull request event
    const isPullRequest = context.eventName === 'pull_request' ||
        context.eventName === 'pull_request_target' ||
        (context.eventName === 'issue_comment' && !!context.payload.issue?.pull_request);
    let prNumber;
    if (isPullRequest) {
        if (context.payload.pull_request) {
            prNumber = context.payload.pull_request.number;
        }
        else if (context.payload.issue) {
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
async function commentOnPR(prNumber, comment, token = process.env.GITHUB_TOKEN || '') {
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
    }
    catch (error) {
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
function formatHelmComment(helmOutput, valuesUsed) {
    const templatePath = (0, path_1.join)(__dirname, 'templates', 'comment-template.md');
    const template = (0, fs_1.readFileSync)(templatePath, 'utf-8');
    return template
        .replace('{{lineCount}}', String(helmOutput.split('\n').length))
        .replace('{{helmOutput}}', helmOutput)
        .replace('{{valuesUsed}}', valuesUsed);
}
