/**
 * Install Workflow Tool Handler
 *
 * Installs workflows to .vibe/workflows/ directory from various sources
 */

import { z } from 'zod';
import { BaseToolHandler } from './base-tool-handler.js';
import { ServerContext } from '../types.js';
import { createLogger } from '../../logger.js';
import fs from 'node:fs';
import path from 'node:path';

const logger = createLogger('InstallWorkflowHandler');

/**
 * Schema for install_workflow tool arguments
 */
const InstallWorkflowArgsSchema = z.object({
  source: z
    .string()
    .describe(
      'Source workflow name (from unloaded workflows) or URL to workflow file'
    ),
  name: z
    .string()
    .optional()
    .describe('Custom name for installed workflow (defaults to source name)'),
});

type InstallWorkflowArgs = z.infer<typeof InstallWorkflowArgsSchema>;

interface InstallWorkflowResponse {
  success: boolean;
  message: string;
  installedPath?: string;
}

/**
 * Tool handler for installing workflows
 */
export class InstallWorkflowHandler extends BaseToolHandler<
  InstallWorkflowArgs,
  InstallWorkflowResponse
> {
  protected readonly argsSchema = InstallWorkflowArgsSchema;

  async executeHandler(
    args: InstallWorkflowArgs,
    context: ServerContext
  ): Promise<InstallWorkflowResponse> {
    logger.info('Installing workflow', {
      source: args.source,
      name: args.name,
      projectPath: context.projectPath,
    });

    try {
      // Create .vibe/workflows directory if it doesn't exist
      const workflowsDir = path.join(context.projectPath, '.vibe', 'workflows');
      fs.mkdirSync(workflowsDir, { recursive: true });

      // Determine if source is a workflow name or URL
      const isUrl =
        args.source.startsWith('http://') || args.source.startsWith('https://');

      if (isUrl) {
        return await this.installFromUrl(args.source, args.name, workflowsDir);
      } else {
        return await this.installFromPredefined(
          args.source,
          args.name,
          workflowsDir,
          context
        );
      }
    } catch (error) {
      const errorMessage = `Failed to install workflow: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error('Workflow installation failed', error as Error, {
        source: args.source,
        name: args.name,
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  private async installFromUrl(
    _url: string,
    _customName: string | undefined,
    _workflowsDir: string
  ): Promise<InstallWorkflowResponse> {
    // For now, return not implemented for URLs
    return {
      success: false,
      message:
        'URL-based workflow installation not yet implemented. Use predefined workflow names.',
    };
  }

  private async installFromPredefined(
    workflowName: string,
    customName: string | undefined,
    workflowsDir: string,
    context: ServerContext
  ): Promise<InstallWorkflowResponse> {
    // Get all available workflows (including unloaded ones)
    const allWorkflows = context.workflowManager.getAllAvailableWorkflows();
    const sourceWorkflow = allWorkflows.find(w => w.name === workflowName);

    if (!sourceWorkflow) {
      return {
        success: false,
        message: `Workflow '${workflowName}' not found. Use list_workflows({include_unloaded: true}) to see available workflows.`,
      };
    }

    // Find the source workflow file
    const workflowsSourceDir = this.findWorkflowsDirectory();
    const sourceFile = path.join(workflowsSourceDir, `${workflowName}.yaml`);

    if (!fs.existsSync(sourceFile)) {
      return {
        success: false,
        message: `Source workflow file not found: ${sourceFile}`,
      };
    }

    // Determine target filename
    const targetName = customName || workflowName;
    const targetFile = path.join(workflowsDir, `${targetName}.yaml`);

    // Check if target already exists
    if (fs.existsSync(targetFile)) {
      return {
        success: false,
        message: `Workflow '${targetName}' already exists in .vibe/workflows/. Remove it first or use a different name.`,
      };
    }

    // Copy the workflow file
    fs.copyFileSync(sourceFile, targetFile);

    // Reload project workflows to make the installed workflow immediately available
    context.workflowManager.loadProjectWorkflows(context.projectPath);

    logger.info('Workflow installed successfully', {
      source: workflowName,
      target: targetName,
      path: targetFile,
    });

    return {
      success: true,
      message: `Workflow '${workflowName}' installed as '${targetName}' in .vibe/workflows/`,
      installedPath: targetFile,
    };
  }

  private findWorkflowsDirectory(): string {
    // Same logic as WorkflowManager
    const possiblePaths = [
      path.join(process.cwd(), 'resources', 'workflows'),
      path.join(process.cwd(), 'dist', '..', 'resources', 'workflows'),
      path.join(process.cwd(), 'src', '..', 'resources', 'workflows'),
    ];

    for (const workflowsPath of possiblePaths) {
      if (fs.existsSync(workflowsPath)) {
        return workflowsPath;
      }
    }

    throw new Error('Workflows directory not found');
  }
}
