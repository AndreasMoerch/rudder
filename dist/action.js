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
exports.runAction = runAction;
const core = __importStar(require("@actions/core"));
const github_1 = require("./github");
const helm_1 = require("./utils/helm");
const yaml_1 = require("./utils/yaml");
/**
 * Main entry point for GitHub Action execution
 * Handles input/output, PR detection, and commenting
 */
async function runAction() {
    try {
        // Get inputs from GitHub Action
        const yamlFilePath = core.getInput('yaml-file', { required: true });
        const valuesPath = core.getInput('values-path');
        const chartPath = core.getInput('chart-path', { required: true });
        const releaseName = core.getInput('release-name') || 'release';
        const namespace = core.getInput('namespace');
        core.info(`Reading YAML file: ${yamlFilePath}`);
        const yamlValue = await (0, yaml_1.readYamlFile)(yamlFilePath, {
            valuesPath: valuesPath || undefined
        });
        core.setOutput('extracted-values', yamlValue.output);
        core.info('Extracted values from YAML file');
        core.info(`Rendering Helm chart: ${chartPath}`);
        const result = await (0, helm_1.helmTemplate)(chartPath, {
            values: [yamlValue.output],
            releaseName,
            namespace: namespace || undefined
        });
        core.setOutput('rendered-yaml', result.output);
        core.info('Successfully rendered Helm chart');
        // Check if running in PR context and post comment
        const githubContext = (0, github_1.getGitHubContext)();
        if (githubContext.isPullRequest && githubContext.prNumber) {
            core.info(`Detected PR #${githubContext.prNumber}, posting comment...`);
            const comment = (0, github_1.formatHelmComment)(result.output, yamlValue.output);
            await (0, github_1.commentOnPR)(githubContext.prNumber, comment);
        }
        else {
            core.info('Not running in PR context, skipping comment');
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('Unknown error occurred');
        }
        throw error;
    }
}
