#!/usr/bin/env node

/**
 * Generate System Prompt Script
 *
 * This script generates the system prompt file from the actual state machine
 * definition to ensure it stays in sync with the codebase.
 *
 * Options:
 * --output=<path>          - Specify output file path (default: SYSTEM_PROMPT.md)
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateSystemPrompt } from '@codemcp/workflows-core';
import { createLogger } from '@codemcp/workflows-core';

const logger = createLogger('GenerateSystemPrompt');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    output: join(process.cwd(), 'SYSTEM_PROMPT.md'),
  };

  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      const outputValue = arg.split('=')[1];
      if (outputValue) {
        options.output = outputValue;
        // If path is not absolute, make it relative to current directory
        if (!options.output.startsWith('/')) {
          options.output = join(process.cwd(), options.output);
        }
      }
    }
  }

  return options;
}

async function main() {
  try {
    const options = parseArgs();
    logger.info('Starting system prompt generation', options);

    // Load the default state machine for prompt generation
    const { StateMachineLoader } = await import('@codemcp/workflows-core');
    const loader = new StateMachineLoader();
    const stateMachine = loader.loadStateMachine(process.cwd()); // Use current directory

    // Generate the system prompt
    const systemPrompt = generateSystemPrompt(stateMachine);

    // Write to output file
    await writeFile(options.output, systemPrompt, 'utf-8');

    logger.info('System prompt written to file', {
      outputPath: options.output,
    });

    // Log the generated prompt to console
    console.log('\n' + '='.repeat(80));
    console.log('GENERATED SYSTEM PROMPT');
    console.log('='.repeat(80));
    console.log(systemPrompt);
    console.log('='.repeat(80));
    console.log(`\nSystem prompt saved to: ${options.output}`);
    console.log(`Length: ${systemPrompt.length} characters`);
  } catch (error) {
    logger.error('Failed to generate system prompt', error as Error);
    console.error('Error generating system prompt:', error);
    process.exit(1);
  }
}

// Run the script
await main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
