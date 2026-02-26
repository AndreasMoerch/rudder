import { readFile } from 'fs/promises';
import YAML from 'yaml';
import { get } from 'lodash';

export interface YamlOptions {
    /** Path to nested object inside the YAML file (e.g., 'spec.source.helm.valuesObject') */
    valuesPath?: string;
}

export interface YamlResult {
    /** The YAML content as a string (parsed and re-stringified) */
    output: string;
}

/**
 * Read and parse a YAML file
 * @param filePath Path to the YAML file
 * @param options Configuration options for reading the YAML file
 * @returns Parsed YAML content
 * @throws Error if file cannot be read, parsed, or if valuesPath doesn't exist
 */
export async function readYamlFile(filePath: string, options: YamlOptions = {}): Promise<YamlResult> {
    try {
        const content = await readFile(filePath, { encoding: 'utf-8' });
        
        let loadedYaml = YAML.parse(content);
        if (options.valuesPath) {
            // Remove leading dot if present for lodash compatibility
            const normalizedPath = options.valuesPath.startsWith('.') 
                ? options.valuesPath.slice(1) 
                : options.valuesPath;
            
            const extracted = get(loadedYaml, normalizedPath);
            
            if (extracted === undefined) {
                throw new Error(`Path '${options.valuesPath}' not found in YAML file`);
            }
            
            loadedYaml = extracted;
        }

        return {
            output: YAML.stringify(loadedYaml)
        };

    } catch (error) {
        throw new Error(`Failed to read YAML file ${filePath}: ${error}`);
    }
}
