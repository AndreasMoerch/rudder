import { runAction } from "./action";
import { helmTemplate } from "./utils/helm";
import { readYamlFile } from "./utils/yaml";
import { join } from "path";

/**
 * Handles input args when running local development. Using sensible defaults if not specified otherwise (will use local chart + values),
 */
function parseArgs(): { valuesFile?: string; valuesSelector?: string; chartPath: string; releaseName?: string; namespace?: string } {
    const args = process.argv.slice(2);
    const get = (flag: string) => {
        const i = args.indexOf(flag);
        return i !== -1 ? args[i + 1] : undefined;
    };

    const root = join(__dirname, '..', 'example');
    return {
        valuesFile:     get('--values-file'),
        valuesSelector: get('--values-selector'),
        chartPath:    get('--chart-path') ?? join(root, 'chart'),
        releaseName:  get('--release-name') ?? 'release',
        namespace:    get('--namespace'),
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
        const { valuesFile, valuesSelector, chartPath, releaseName, namespace } = parseArgs();

        const renderChart = (values: string[]) =>
            helmTemplate(chartPath, { values, releaseName, namespace: namespace || undefined })
                .then(result => {
                    console.log('\n=== Rendered Chart ===');
                    console.log(result.output);
                });

        const run = valuesFile
            ? readYamlFile(valuesFile, { valuesPath: valuesSelector }).then(v => renderChart([v.output]))
            : renderChart([]);

        run.catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
    }
}