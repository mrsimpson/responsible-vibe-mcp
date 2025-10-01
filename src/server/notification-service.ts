/**
 * Notification Service
 *
 * Simple event system for notifying MCP client of changes
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

class NotificationService {
  private mcpServer?: McpServer;

  setMcpServer(server: McpServer): void {
    this.mcpServer = server;
  }

  async notifyToolListChanged(): Promise<void> {
    if (this.mcpServer) {
      this.mcpServer.sendToolListChanged();
    }
  }
}

export const notificationService = new NotificationService();
