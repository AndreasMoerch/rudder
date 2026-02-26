"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action_1 = require("./action");
const helm_1 = require("./utils/helm");
const yaml_1 = require("./utils/yaml");
const path_1 = require("path");
if (require.main === module) {
    if (process.env.GITHUB_ACTIONS === 'true') {
        (0, action_1.runAction)().catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
    }
    else {
        // Local dev: render example chart
        const root = (0, path_1.join)(__dirname, '..', 'example');
        const yamlFilePath = (0, path_1.join)(root, 'values.yaml');
        const chartPath = (0, path_1.join)(root, 'chart');
        (0, yaml_1.readYamlFile)(yamlFilePath)
            .then(yamlValue => (0, helm_1.helmTemplate)(chartPath, { values: [yamlValue.output], releaseName: 'release' }))
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
