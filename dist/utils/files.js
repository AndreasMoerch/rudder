"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTempFiles = withTempFiles;
const crypto_1 = require("crypto");
const promises_1 = require("fs/promises");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
/**
 * Creates temp files, executes operation, then cleans up files
 * Ensures cleanup happens even if operation fails
 * @param contents Array of file contents to write to temp files
 * @param operation Callback that receives array of temp file paths
 * @param fileExtension File extension for temp files (default: .yaml)
 * @returns Result of the operation
 */
async function withTempFiles(contents, operation, fileExtension = '.yaml') {
    const tempFiles = [];
    try {
        // Create temp files
        for (const content of contents) {
            const fileName = `temp-${(0, crypto_1.randomUUID)()}${fileExtension}`;
            const tempFile = path.join(os.tmpdir(), fileName);
            console.error(`Writing temp file: ${tempFile}`);
            await (0, promises_1.writeFile)(tempFile, content, 'utf-8');
            tempFiles.push(tempFile);
        }
        // Execute operation with temp files
        return await operation(tempFiles);
    }
    finally {
        // Always clean up temp files
        await Promise.allSettled(tempFiles.map(async (file) => {
            try {
                await (0, promises_1.unlink)(file);
            }
            catch (e) {
                console.error(`Failed to delete temp file ${file}:`, e);
            }
        }));
    }
}
