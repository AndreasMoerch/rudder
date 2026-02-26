import { spawn } from 'child_process';

/**
 * Execute a CLI command with arguments using spawn
 * @param command The command to execute (e.g., 'helm')
 * @param args Array of command arguments
 * @returns Promise resolving to stdout content
 * @throws Error if command fails or is not available
 * 
 * Note: Debug information is logged to stderr to keep stdout clean for piping
 */
export async function executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        console.error(`Executing command: ${command} ${args.join(' ')}`)
        
        const proc = spawn(command, args);
        
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
            } else {
                resolve(stdout);
            }
        });
        
        proc.on('error', (error: NodeJS.ErrnoException) => {
            reject(new Error(`${command} is not installed or not available in $PATH: ${error.message}`));
        });
    });
}
