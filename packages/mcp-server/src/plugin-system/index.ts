/**
 * Plugin system exports
 *
 * This module provides the core plugin system for extending responsible-vibe-mcp
 * functionality without if-statements in the core application.
 */

// Core plugin interfaces
export type {
  IPlugin,
  IPluginRegistry,
  PluginHooks,
  PluginHookContext,
  StartDevelopmentArgs,
  StartDevelopmentResult,
  GeneratedInstructions,
} from './plugin-interfaces.js';

// Plugin registry implementation
export { PluginRegistry } from './plugin-registry.js';
