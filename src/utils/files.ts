import { randomUUID } from 'crypto';
import { writeFile, unlink } from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

/**
 * Creates temp files, executes operation, then cleans up files
 * Ensures cleanup happens even if operation fails
 * @param contents Array of file contents to write to temp files
 * @param operation Callback that receives array of temp file paths
 * @param fileExtension File extension for temp files (default: .yaml)
 * @returns Result of the operation
 */
export async function withTempFiles<T>(
    contents: string[],
    operation: (tempFiles: string[]) => Promise<T>,
    fileExtension: string = '.yaml'
): Promise<T> {
    const tempFiles: string[] = [];

    try {
        // Create temp files
        for (const content of contents) {
            const fileName = `temp-${randomUUID()}${fileExtension}`;
            const tempFile = path.join(os.tmpdir(), fileName);

            console.error(`Writing temp file: ${tempFile}`);
            await writeFile(tempFile, content, 'utf-8');

            tempFiles.push(tempFile);
        }

        // Execute operation with temp files
        return await operation(tempFiles);
    } finally {
        // Always clean up temp files
        await Promise.allSettled(
            tempFiles.map(async file => {
                try {
                    await unlink(file);
                } catch (e) {
                    console.error(`Failed to delete temp file ${file}:`, e);
                }
            })
        );
    }
}
