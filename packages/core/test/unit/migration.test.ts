/**
 * Migration Tests
 *
 * Tests the migration from SQLite to file-based persistence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectLegacyDatabase,
  fileStorageExists,
  migrateSQLiteToFiles,
  autoMigrateIfNeeded,
} from '../../src/migration.js';
import { Database } from '../../src/database.js';
import type { ConversationState } from '../../src/types.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

describe('Migration', () => {
  let tempDir: string;
  let sqlitePath: string;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = await fs.mkdtemp('/tmp/migration-test-');
    sqlitePath = join(tempDir, 'conversation.sqlite');
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('detectLegacyDatabase()', () => {
    it('should return true when SQLite file exists', async () => {
      // Create a dummy SQLite file
      await fs.writeFile(sqlitePath, 'dummy');

      const result = detectLegacyDatabase(sqlitePath);
      expect(result).toBe(true);
    });

    it('should return false when SQLite file does not exist', () => {
      const result = detectLegacyDatabase(sqlitePath);
      expect(result).toBe(false);
    });
  });

  describe('fileStorageExists()', () => {
    it('should return true when conversations directory exists', async () => {
      const conversationsDir = join(tempDir, 'conversations');
      await fs.mkdir(conversationsDir, { recursive: true });

      const result = await fileStorageExists(sqlitePath);
      expect(result).toBe(true);
    });

    it('should return false when conversations directory does not exist', async () => {
      const result = await fileStorageExists(sqlitePath);
      expect(result).toBe(false);
    });
  });

  describe('migrateSQLiteToFiles()', () => {
    it('should migrate conversation states from SQLite to files', async () => {
      // Create SQLite database with test data
      const database = new Database(sqlitePath);
      await database.initialize();

      const state1: ConversationState = {
        conversationId: 'test-conv-1',
        projectPath: '/test/project1',
        gitBranch: 'main',
        currentPhase: 'explore',
        planFilePath: '/test/project1/.vibe/plan.md',
        workflowName: 'epcc',
        requireReviewsBeforePhaseTransition: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const state2: ConversationState = {
        conversationId: 'test-conv-2',
        projectPath: '/test/project2',
        gitBranch: 'feature',
        currentPhase: 'code',
        planFilePath: '/test/project2/.vibe/plan.md',
        workflowName: 'waterfall',
        requireReviewsBeforePhaseTransition: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.saveConversationState(state1);
      await database.saveConversationState(state2);
      await database.close();

      // Perform migration
      const result = await migrateSQLiteToFiles(sqlitePath);

      // Verify migration success
      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(2);
      expect(result.backupPath).toContain('.backup-');

      // Verify backup was created
      expect(existsSync(result.backupPath)).toBe(true);

      // Verify files were created
      const conversationsDir = join(tempDir, 'conversations');
      const state1Path = join(conversationsDir, 'test-conv-1', 'state.json');
      const state2Path = join(conversationsDir, 'test-conv-2', 'state.json');

      expect(existsSync(state1Path)).toBe(true);
      expect(existsSync(state2Path)).toBe(true);

      // Verify file content
      const migratedState1 = JSON.parse(await fs.readFile(state1Path, 'utf-8'));
      expect(migratedState1.conversationId).toBe('test-conv-1');
      expect(migratedState1.currentPhase).toBe('explore');
    });

    it('should handle empty SQLite database', async () => {
      // Create empty SQLite database
      const database = new Database(sqlitePath);
      await database.initialize();
      await database.close();

      // Perform migration
      const result = await migrateSQLiteToFiles(sqlitePath);

      // Verify migration success with 0 records
      // Note: Empty database may not create a file, so message may indicate no database found
      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(0);
      expect(
        result.message.includes('No conversation states') ||
          result.message.includes('No legacy SQLite database found')
      ).toBe(true);
    });

    it('should create backup before migration', async () => {
      // Create SQLite database with test data
      const database = new Database(sqlitePath);
      await database.initialize();

      const state: ConversationState = {
        conversationId: 'test-conv-3',
        projectPath: '/test/project',
        gitBranch: 'main',
        currentPhase: 'explore',
        planFilePath: '/test/project/.vibe/plan.md',
        workflowName: 'epcc',
        requireReviewsBeforePhaseTransition: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.saveConversationState(state);
      await database.close();

      // Get original file size
      const originalStats = await fs.stat(sqlitePath);

      // Perform migration
      const result = await migrateSQLiteToFiles(sqlitePath);

      // Verify backup exists and has same size
      expect(existsSync(result.backupPath)).toBe(true);
      const backupStats = await fs.stat(result.backupPath);
      expect(backupStats.size).toBe(originalStats.size);
    });
  });

  describe('autoMigrateIfNeeded()', () => {
    it('should migrate when SQLite exists and file storage does not', async () => {
      // Create SQLite database with test data
      const database = new Database(sqlitePath);
      await database.initialize();

      const state: ConversationState = {
        conversationId: 'test-conv-4',
        projectPath: '/test/project',
        gitBranch: 'main',
        currentPhase: 'explore',
        planFilePath: '/test/project/.vibe/plan.md',
        workflowName: 'epcc',
        requireReviewsBeforePhaseTransition: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.saveConversationState(state);
      await database.close();

      // Auto-migrate
      const result = await autoMigrateIfNeeded(sqlitePath);

      // Verify migration happened
      expect(result).toBe(true);

      // Verify file was created
      const conversationsDir = join(tempDir, 'conversations');
      const statePath = join(conversationsDir, 'test-conv-4', 'state.json');
      expect(existsSync(statePath)).toBe(true);
    });

    it('should skip migration when no SQLite exists', async () => {
      // No SQLite file created

      const result = await autoMigrateIfNeeded(sqlitePath);

      // Should succeed (nothing to migrate)
      expect(result).toBe(true);

      // Verify no conversations directory was created
      const conversationsDir = join(tempDir, 'conversations');
      expect(existsSync(conversationsDir)).toBe(false);
    });

    it('should skip migration when file storage already exists', async () => {
      // Create SQLite database
      const database = new Database(sqlitePath);
      await database.initialize();
      await database.close();

      // Create conversations directory (simulating existing file storage)
      const conversationsDir = join(tempDir, 'conversations');
      await fs.mkdir(conversationsDir, { recursive: true });

      const result = await autoMigrateIfNeeded(sqlitePath);

      // Should succeed (skip migration)
      expect(result).toBe(true);

      // Verify no backup was created
      const files = await fs.readdir(tempDir);
      const backupFiles = files.filter(f => f.includes('.backup-'));
      expect(backupFiles).toHaveLength(0);
    });
  });
});
