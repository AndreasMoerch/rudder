import { runAction } from "./action";
import { helmTemplate } from "./utils/helm";
import { readYamlFile } from "./utils/yaml";
import { join } from "path";

/**
 * Handles input args when running local development. Using sensible defaults if not specified otherwise (will use local chart + values),
 */
function parseArgs(): { yamlFile?: string; valuesPath?: string; chartPath: string; releaseName?: string; namespace?: string } {
    const args = process.argv.slice(2);
    const get = (flag: string) => {
        const i = args.indexOf(flag);
        return i !== -1 ? args[i + 1] : undefined;
    };

    const root = join(__dirname, '..', 'example');
    return {
        yamlFile: get('--yaml-file'),
        valuesPath: get('--values-path'),
        chartPath: get('--chart-path') ?? join(root, 'chart'),
        releaseName: get('--release-name') ?? 'release',
        namespace: get('--namespace'),
    };
}

// Entry point
if (require.main === module) {
    if (process.env.GITHUB_ACTIONS === 'true') {
        runAction().catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
    } else {
        const { yamlFile, valuesPath, chartPath, releaseName, namespace } = parseArgs();

        const renderChart = (values: string[]) =>
            helmTemplate(chartPath, { values, releaseName, namespace: namespace || undefined })
                .then(result => {
                    console.log('\n=== Rendered Chart ===');
                    console.log(result.output);
                });

        const run = yamlFile
            ? readYamlFile(yamlFile, { valuesPath }).then(v => renderChart([v.output]))
            : renderChart([]);

        run.catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
    }
}