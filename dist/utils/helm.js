"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helmTemplate = helmTemplate;
const cli_1 = require("./cli");
const files_1 = require("./files");
/**
 * Execute helm template command to render chart templates locally
 * Creates temp files for values to support multiple -f flags
 * @param chart Path to the Helm chart or chart reference
 * @param options Configuration options for helm template
 * @returns Rendered YAML output
 * @throws Error if helm command fails
 */
async function helmTemplate(chart, options = {}) {
    await verifyHelmInstalled();
    const releaseName = options.releaseName || 'release';
    const args = ['template', releaseName, chart];
    if (options.namespace) {
        args.push('--namespace', options.namespace);
    }
    // Helm cli does not support parsing of in-line values, so the values are stored as temporary files
    return (0, files_1.withTempFiles)(options.values || [], async (tempFiles) => {
        tempFiles.forEach(tmpFile => {
            args.push('-f', tmpFile);
        });
        const renderedChart = await (0, cli_1.executeCommand)('helm', args);
        return { output: renderedChart };
    });
}
/**
 * Verifies tat the helm cli tool is installed.
 */
async function verifyHelmInstalled() {
    try {
        await (0, cli_1.executeCommand)('helm', ['version', '--short']);
        console.error('Helm CLI is available');
    }
    catch (error) {
        throw new Error('Helm CLI is not installed or not available in $PATH');
    }
}
