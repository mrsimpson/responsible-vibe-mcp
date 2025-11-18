/**
 * System Prompt Resource Tests
 *
 * Tests for the system-prompt resource handler to ensure it properly
 * exposes the system prompt through the MCP protocol.
 */

import { describe, it, expect } from 'vitest';
import { SystemPromptResourceHandler } from '../../src/resource-handlers/system-prompt.js';
import type { ServerContext } from '../../src/types.js';

describe('System Prompt Resource', () => {
  it('should expose system prompt as MCP resource', async () => {
    const handler = new SystemPromptResourceHandler();

    // Call the handler directly
    const result = await handler.handle(
      new URL('system-prompt://'),
      {} as ServerContext
    );

    // Verify the safeExecute wrapper structure
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    const data = result.data!;
    expect(data.uri).toBe('system-prompt://');
    expect(data.mimeType).toBe('text/plain');
    expect(data.text).toBeDefined();
    expect(typeof data.text).toBe('string');

    // Verify content contains expected system prompt elements (streamlined version)
    expect(data.text).toContain(
      'You are an AI assistant that helps users develop software features'
    );
    expect(data.text).toContain('responsible-vibe-mcp');
    expect(data.text).toContain('whats_next()');
    expect(data.text).toContain('instructions');
    expect(data.text).toContain('development plan');

    // Verify it's concise but not empty (streamlined prompt is ~400 chars)
    expect(data.text.length).toBeGreaterThan(200);
    expect(data.text.length).toBeLessThan(1000);
  });

  it('should be workflow-independent and consistent', async () => {
    const handler = new SystemPromptResourceHandler();

    // Get system prompt multiple times
    const result1 = await handler.handle(
      new URL('system-prompt://'),
      {} as ServerContext
    );
    const result2 = await handler.handle(
      new URL('system-prompt://'),
      {} as ServerContext
    );
    const result3 = await handler.handle(
      new URL('system-prompt://'),
      {} as ServerContext
    );

    // All should be successful
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);

    // All should be identical
    expect(result1.data!.text).toBe(result2.data!.text);
    expect(result2.data!.text).toBe(result3.data!.text);

    // Verify the prompt contains standard elements (streamlined version)
    expect(result1.data!.text).toContain('You are an AI assistant');
    expect(result1.data!.text).toContain('whats_next()');
    expect(result1.data!.text).toContain('development');
    expect(result1.data!.text).toContain('instructions');
  });

  it('should use streamlined system prompt', async () => {
    const handler = new SystemPromptResourceHandler();

    const result = await handler.handle(
      new URL('system-prompt://'),
      {} as ServerContext
    );

    expect(result.success).toBe(true);

    // The streamlined system prompt should be concise and focused
    // It relies on tool responses for detailed phase instructions
    expect(result.data!.text).toContain(
      'You are an AI assistant that helps users develop software features'
    );
    expect(result.data!.text).toContain('whats_next()');
    expect(result.data!.text).toContain('instructions');
    expect(result.data!.text).toContain('development plan');

    // Streamlined prompt should be concise (~400 chars vs old 2000+)
    expect(result.data!.text.length).toBeLessThan(1000);
  });
});
