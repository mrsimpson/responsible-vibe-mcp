/**
 * No Idea Tool Handler
 *
 * Provides instructions for LLMs to acknowledge knowledge gaps
 * instead of hallucinating responses.
 */

import { z } from 'zod';
import { BaseToolHandler } from './base-tool-handler.js';
import { ServerContext } from '@responsible-vibe/core';

/**
 * Schema for no_idea tool arguments
 */
const NoIdeaArgsSchema = z.object({
  context: z
    .string()
    .optional()
    .describe('Optional context about what you have no knowledge of'),
});

export type NoIdeaArgs = z.infer<typeof NoIdeaArgsSchema>;

/**
 * Response format for no_idea tool
 */
export interface NoIdeaResponse {
  instructions: string;
}

/**
 * Tool handler for acknowledging knowledge gaps
 */
export class NoIdeaHandler extends BaseToolHandler<NoIdeaArgs, NoIdeaResponse> {
  protected readonly argsSchema = NoIdeaArgsSchema;

  async executeHandler(
    args: NoIdeaArgs,
    _context: ServerContext
  ): Promise<NoIdeaResponse> {
    const context = args.context?.trim() || 'this topic';

    const instructions = `You have no clue how to respond to ${context}. Admit it. Ask the user clarifying questions which might help you get new ideas.`;

    return { instructions };
  }
}
