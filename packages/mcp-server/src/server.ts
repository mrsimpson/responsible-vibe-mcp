/**
 * Vibe Feature MCP Server Core
 *
 * Updated to use the new modular architecture while maintaining backward compatibility.
 * The actual implementation is now in src/server/ with proper separation of concerns.
 */

import {
  ResponsibleVibeMCPServer as ModularResponsibleVibeMCPServer,
  createResponsibleVibeMCPServer as createModularServer,
} from './server-implementation.js';
import { ServerConfig as ModularServerConfig } from './types.js';

/**
 * Factory function for creating server instances (recommended approach)
 */
export const createResponsibleVibeMCPServer = createModularServer;

/**
 * Main server class that maintains backward compatibility
 * while using the new modular architecture internally
 */
export class ResponsibleVibeMCPServer extends ModularResponsibleVibeMCPServer {
  // This class is kept for backward compatibility but users should use the factory function
}

// Re-export types for backward compatibility
export type ServerConfig = ModularServerConfig;
