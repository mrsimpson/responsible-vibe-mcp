/**
 * Dual Import Helper
 *
 * Handles workspace vs published package imports generically
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates a lazy loader for dual imports (workspace vs published package)
 */
export function createDualImport<T>(
  workspaceImport: string,
  relativePath: string
): () => Promise<T> {
  let cachedModule: T | null = null;

  return async (): Promise<T> => {
    if (cachedModule) {
      return cachedModule;
    }

    const fullRelativePath = join(__dirname, relativePath);
    const isPublishedPackage = existsSync(fullRelativePath);

    if (isPublishedPackage) {
      // Published package - use relative import
      cachedModule = (await import(relativePath)) as T;
    } else {
      // Local development - use workspace import
      cachedModule = (await import(workspaceImport)) as T;
    }

    return cachedModule as T;
  };
}
