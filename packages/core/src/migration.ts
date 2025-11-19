/**
 * Migration Utilities
 *
 * Handles migration from SQLite-based persistence to file-based persistence.
 * Automatically detects legacy SQLite databases and migrates conversation states
 * to the new file-based structure.
 */

import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { createLogger } from './logger.js';
import { Database } from './database.js';
import type { ConversationState } from './types.js';

const logger = createLogger('Migration');

/**
 * Check if a legacy SQLite database exists
 * Checks both conversation.sqlite and conversation-state.sqlite (legacy names)
 */
export function detectLegacyDatabase(basePath: string): boolean {
  const sqlitePath = basePath;
  const legacyStatePath = sqlitePath.replace(
    'conversation.sqlite',
    'conversation-state.sqlite'
  );

  const exists = existsSync(sqlitePath) || existsSync(legacyStatePath);

  if (exists) {
    logger.debug('Legacy SQLite database detected', {
      sqlitePath: existsSync(sqlitePath) ? sqlitePath : legacyStatePath,
    });
  }

  return exists;
}

/**
 * Get the actual legacy SQLite path (could be conversation.sqlite or conversation-state.sqlite)
 */
function getLegacySQLitePath(basePath: string): string | null {
  const sqlitePath = basePath;
  const legacyStatePath = sqlitePath.replace(
    'conversation.sqlite',
    'conversation-state.sqlite'
  );

  if (existsSync(sqlitePath)) {
    return sqlitePath;
  }
  if (existsSync(legacyStatePath)) {
    return legacyStatePath;
  }
  return null;
}

/**
 * Check if file-based storage already exists
 */
export async function fileStorageExists(basePath: string): Promise<boolean> {
  const conversationsDir = join(dirname(basePath), 'conversations');

  try {
    const stats = await fs.stat(conversationsDir);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Create a backup of the SQLite database
 */
async function createBackup(sqlitePath: string): Promise<string> {
  const backupPath = `${sqlitePath}.backup-${Date.now()}`;

  try {
    await fs.copyFile(sqlitePath, backupPath);
    logger.info('Created SQLite backup', { sqlitePath, backupPath });
    return backupPath;
  } catch (error) {
    logger.error('Failed to create SQLite backup', error as Error, {
      sqlitePath,
      backupPath,
    });
    throw error;
  }
}

/**
 * Read all conversation states from SQLite database
 */
async function readSQLiteStates(
  sqlitePath: string
): Promise<ConversationState[]> {
  const database = new Database(sqlitePath);

  try {
    await database.initialize();
    const states = await database.getAllConversationStates();
    await database.close();

    logger.debug('Read conversation states from SQLite', {
      count: states.length,
    });

    return states;
  } catch (error) {
    await database.close();
    logger.error('Failed to read SQLite states', error as Error);
    throw error;
  }
}

/**
 * Write conversation states to file-based storage
 */
async function writeFileStates(
  states: ConversationState[],
  conversationsDir: string
): Promise<void> {
  // Create conversations directory
  await fs.mkdir(conversationsDir, { recursive: true });

  for (const state of states) {
    const stateDir = join(conversationsDir, state.conversationId);
    const stateFilePath = join(stateDir, 'state.json');

    try {
      // Create conversation directory
      await fs.mkdir(stateDir, { recursive: true });

      // Write state.json
      const stateJson = JSON.stringify(state, null, 2);
      await fs.writeFile(stateFilePath, stateJson, 'utf-8');

      logger.debug('Migrated conversation state to file', {
        conversationId: state.conversationId,
        stateFilePath,
      });
    } catch (error) {
      logger.error(
        'Failed to write conversation state to file',
        error as Error,
        {
          conversationId: state.conversationId,
          stateFilePath,
        }
      );
      throw error;
    }
  }
}

/**
 * Migrate from SQLite to file-based storage
 *
 * @param basePath - Path to the SQLite database (e.g., .vibe/conversation.sqlite)
 * @returns Migration result with statistics
 */
export async function migrateSQLiteToFiles(basePath: string): Promise<{
  success: boolean;
  migratedCount: number;
  backupPath: string;
  message: string;
}> {
  // Get actual legacy SQLite path (could be conversation.sqlite or conversation-state.sqlite)
  const actualSQLitePath = getLegacySQLitePath(basePath);

  if (!actualSQLitePath) {
    return {
      success: true,
      migratedCount: 0,
      backupPath: '',
      message: 'No legacy SQLite database found',
    };
  }

  const conversationsDir = join(dirname(basePath), 'conversations');

  logger.info('Starting SQLite to file-based migration', {
    sqlitePath: actualSQLitePath,
  });

  try {
    // Step 1: Read all states from SQLite first (before backup)
    const states = await readSQLiteStates(actualSQLitePath);

    if (states.length === 0) {
      logger.info('No conversation states to migrate');
      return {
        success: true,
        migratedCount: 0,
        backupPath: '',
        message: 'No conversation states found in SQLite database',
      };
    }

    // Step 2: Create backup (only if there are states to migrate)
    const backupPath = await createBackup(actualSQLitePath);

    // Step 3: Write states to file-based storage
    await writeFileStates(states, conversationsDir);

    const message = `Successfully migrated ${states.length} conversation state(s) from SQLite to file-based storage. Backup created at ${backupPath}`;
    logger.info('Migration completed successfully', {
      migratedCount: states.length,
      backupPath,
    });

    return {
      success: true,
      migratedCount: states.length,
      backupPath,
      message,
    };
  } catch (error) {
    const errorMessage = `Migration failed: ${(error as Error).message}`;
    logger.error('Migration failed', error as Error);

    return {
      success: false,
      migratedCount: 0,
      backupPath: '',
      message: errorMessage,
    };
  }
}

/**
 * Check if migration is needed and perform it
 * Called automatically during FileStorage initialization
 *
 * @param basePath - Path to the SQLite database location
 * @returns True if migration was performed or not needed, false if migration failed
 */
export async function autoMigrateIfNeeded(basePath: string): Promise<boolean> {
  // Check if legacy SQLite exists
  const hasLegacySQLite = detectLegacyDatabase(basePath);

  if (!hasLegacySQLite) {
    logger.debug('No legacy SQLite database found, skipping migration');
    return true;
  }

  // Check if file-based storage already exists
  const hasFileStorage = await fileStorageExists(basePath);

  if (hasFileStorage) {
    logger.debug('File-based storage already exists, skipping migration');
    return true;
  }

  // Perform migration
  logger.info(
    'Legacy SQLite detected and no file storage exists, starting migration'
  );
  const result = await migrateSQLiteToFiles(basePath);

  if (result.success) {
    logger.info('Auto-migration completed', {
      migratedCount: result.migratedCount,
    });
  } else {
    logger.error('Auto-migration failed', new Error(result.message));
  }

  return result.success;
}
