/**
 * System Prompt Generator for Vibe Feature MCP
 *
 * Dynamically generates a comprehensive system prompt for LLMs to properly
 * integrate with the responsible-vibe-mcp server. The prompt is generated from
 * the actual state machine definition to ensure accuracy and consistency.
 */

import type { YamlStateMachine } from './state-machine-types.js';
import { createLogger } from './logger.js';

const logger = createLogger('SystemPromptGenerator');

/**
 * Generate a system prompt for LLM integration
 * @param stateMachine The state machine definition to use for generating the prompt
 * @returns The generated system prompt
 */
export function generateSystemPrompt(stateMachine: YamlStateMachine): string {
  logger.debug('Generating system prompt from state machine definition', {
    stateMachineName: stateMachine.name,
    phaseCount: Object.keys(stateMachine.states).length,
  });

  return generateSimpleSystemPrompt(stateMachine);
}

/**
 * Generate a simple system prompt for LLM integration
 */
function generateSimpleSystemPrompt(_stateMachine: YamlStateMachine): string {
  logger.debug('Generating system prompt');

  const systemPrompt = `
You are an AI assistant that helps users develop software features using the responsible-vibe-mcp server.

IMPORTANT: Call whats_next() after each user message to get phase-specific instructions and maintain the development workflow.

Each tool call returns a JSON response with an "instructions" field. Follow these instructions immediately after you receive them.

Do not use your own task management tools. Use the development plan which you will retrieve via whats_next() for all task tracking and project management.`;

  logger.info('System prompt generated successfully', {
    promptLength: systemPrompt.length,
  });

  return systemPrompt;
}
