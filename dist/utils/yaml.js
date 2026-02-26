"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readYamlFile = readYamlFile;
const promises_1 = require("fs/promises");
const yaml_1 = __importDefault(require("yaml"));
const lodash_1 = require("lodash");
/**
 * Read and parse a YAML file
 * @param filePath Path to the YAML file
 * @param options Configuration options for reading the YAML file
 * @returns Parsed YAML content
 * @throws Error if file cannot be read, parsed, or if valuesPath doesn't exist
 */
async function readYamlFile(filePath, options = {}) {
    try {
        const content = await (0, promises_1.readFile)(filePath, { encoding: 'utf-8' });
        let loadedYaml = yaml_1.default.parse(content);
        if (options.valuesPath) {
            // Remove leading dot if present for lodash compatibility
            const normalizedPath = options.valuesPath.startsWith('.')
                ? options.valuesPath.slice(1)
                : options.valuesPath;
            const extracted = (0, lodash_1.get)(loadedYaml, normalizedPath);
            if (extracted === undefined) {
                throw new Error(`Path '${options.valuesPath}' not found in YAML file`);
            }
            loadedYaml = extracted;
        }
        return {
            output: yaml_1.default.stringify(loadedYaml)
        };
    }
    catch (error) {
        throw new Error(`Failed to read YAML file ${filePath}: ${error}`);
    }
}
