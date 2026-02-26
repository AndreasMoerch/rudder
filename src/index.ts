import { runAction } from "./action";
import { helmTemplate } from "./utils/helm";
import { readYamlFile } from "./utils/yaml";
import { join } from "path";

if (require.main === module) {
    if (process.env.GITHUB_ACTIONS === 'true') {
        runAction().catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
    } else {
        // Local dev: render example chart
        const root = join(__dirname, '..', 'example');
        const yamlFilePath = join(root, 'values.yaml');
        const chartPath = join(root, 'chart');

        readYamlFile(yamlFilePath)
            .then(yamlValue => helmTemplate(chartPath, { values: [yamlValue.output], releaseName: 'release' }))
            .then(result => {
                console.log('\n=== Rendered Chart ===');
                console.log(result.output);
            })
            .catch(error => {
                console.error('Error:', error);
                process.exit(1);
            });
    }
}