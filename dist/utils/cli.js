"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommand = executeCommand;
const child_process_1 = require("child_process");
/**
 * Execute a CLI command with arguments using spawn
 * @param command The command to execute (e.g., 'helm')
 * @param args Array of command arguments
 * @returns Promise resolving to stdout content
 * @throws Error if command fails or is not available
 *
 * Note: Debug information is logged to stderr to keep stdout clean for piping
 */
async function executeCommand(command, args) {
    return new Promise((resolve, reject) => {
        console.error(`Executing command: ${command} ${args.join(' ')}`);
        const proc = (0, child_process_1.spawn)(command, args);
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        proc.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = stderr.trim() || stdout.trim() || 'Unknown error';
                reject(new Error(`${command} exited with code ${code}: ${errorMessage}`));
            }
            else {
                resolve(stdout);
            }
        });
        proc.on('error', (error) => {
            reject(new Error(`${command} is not installed or not available in $PATH: ${error.message}`));
        });
    });
}
