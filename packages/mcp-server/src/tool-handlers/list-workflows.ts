/**
 * List Workflows Tool Handler
 *
 * Provides an overview of all available workflows with their descriptions
 * and resource URIs for detailed information.
 */

import { z } from 'zod';
import { BaseToolHandler } from './base-tool-handler.js';
import { createLogger } from '@codemcp/workflows-core';
import { ServerContext } from '../types.js';

const logger = createLogger('ListWorkflowsHandler');

/**
 * Schema for list_workflows tool arguments
 */
const ListWorkflowsArgsSchema = z.object({});

type ListWorkflowsArgs = z.infer<typeof ListWorkflowsArgsSchema>;

/**
 * Response format for workflow information
 */
interface WorkflowOverview {
  name: string;
  displayName: string;
  description: string;
  resourceUri: string;
}

interface ListWorkflowsResponse {
  workflows: WorkflowOverview[];
}

/**
 * Tool handler for listing available workflows
 */
export class ListWorkflowsHandler extends BaseToolHandler<
  ListWorkflowsArgs,
  ListWorkflowsResponse
> {
  protected readonly argsSchema = ListWorkflowsArgsSchema;

  async executeHandler(
    _args: ListWorkflowsArgs,
    context: ServerContext
  ): Promise<ListWorkflowsResponse> {
    logger.info('Listing available workflows', {
      projectPath: context.projectPath,
    });

    // Get only loaded workflows (respects current domain filtering)
    const availableWorkflows =
      context.workflowManager.getAvailableWorkflowsForProject(
        context.projectPath
      );

    // Transform to response format with resource URIs
    const workflows: WorkflowOverview[] = availableWorkflows.map(workflow => ({
      name: workflow.name,
      displayName: workflow.displayName,
      description: workflow.description,
      resourceUri: `workflow://${workflow.name}`,
    }));

    const response: ListWorkflowsResponse = {
      workflows,
    };

    logger.info('Successfully listed workflows', {
      count: workflows.length,
      workflows: workflows.map(w => w.name),
    });

    return response;
  }
}
