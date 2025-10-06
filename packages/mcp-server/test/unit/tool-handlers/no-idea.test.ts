/**
 * Tests for NoIdeaHandler
 */

import { describe, it, expect } from 'vitest';
import { NoIdeaHandler } from '../../../src/tool-handlers/no-idea.js';
import { MockContextFactory } from '../../utils/test-helpers.js';

describe('NoIdeaHandler', () => {
  const handler = new NoIdeaHandler();
  const mockContext = MockContextFactory.createBasicContext('/tmp/test');

  it('should return instructions with key terms', async () => {
    const result = await handler.handle({}, mockContext);

    expect(result.success).toBe(true);
    const instructions = result.data?.instructions || '';
    expect(instructions.toLowerCase()).toContain('you have no');
    expect(instructions.toLowerCase()).toContain('admit');
    expect(instructions.toLowerCase()).toContain('clarify');
  });

  it('should include provided context', async () => {
    const result = await handler.handle(
      { context: 'quantum physics' },
      mockContext
    );

    expect(result.success).toBe(true);
    const instructions = result.data?.instructions || '';
    expect(instructions).toContain('quantum physics');
  });

  it('should handle empty context', async () => {
    const result = await handler.handle({ context: '' }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.instructions).toBeDefined();
  });
});
