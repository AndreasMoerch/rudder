import { executeCommand } from './cli';
import { withTempFiles } from './files';

export interface HelmTemplateOptions {
    /** Array of YAML value strings to pass to helm template (equivalent to multiple -f flags) */
    values?: string[];
    /** Release name for template rendering. Populates {{ .Release.Name }} in templates. Defaults to 'release' */
    releaseName?: string;
    /** Kubernetes namespace for template rendering. Populates {{ .Release.Namespace }} in templates */
    namespace?: string;
}

export interface HelmTemplateResult {
    /** The rendered YAML output from helm template command */
    output: string;
}

/**
 * Execute helm template command to render chart templates locally
 * Creates temp files for values to support multiple -f flags
 * @param chart Path to the Helm chart or chart reference
 * @param options Configuration options for helm template
 * @returns Rendered YAML output
 * @throws Error if helm command fails
 */
export async function helmTemplate(chart: string, options: HelmTemplateOptions = {}): Promise<HelmTemplateResult> {
    await verifyHelmInstalled();

    const releaseName = options.releaseName || 'release';
    const args = ['template', releaseName, chart];
    
    if (options.namespace) {
        args.push('--namespace', options.namespace);
    }

    // Helm cli does not support parsing of in-line values, so the values are stored as temporary files
    return withTempFiles(options.values || [], async (tempFiles) => {
        tempFiles.forEach(tmpFile => {
            args.push('-f', tmpFile);
        });

        const renderedChart = await executeCommand('helm', args);
        return { output: renderedChart };
    })
}

/**
 * Verifies tat the helm cli tool is installed.
 */
async function verifyHelmInstalled() {
    try {
        await executeCommand('helm', ['version', '--short']);
        console.error('Helm CLI is available');
    } catch (error) {
        throw new Error('Helm CLI is not installed or not available in $PATH');
    }
}
