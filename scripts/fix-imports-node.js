#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const serverTypes = [
  'ResourceHandler',
  'ServerContext',
  'HandlerResult',
  'ResourceContent',
  'McpToolResponse',
  'McpResourceResponse',
  'ServerConfig',
  'ToolRegistry',
  'ResourceRegistry',
  'ResponseRenderer',
];

function fixImports(filePath, typesPath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const newLines = [];

  for (const line of lines) {
    if (
      line.includes("from '@responsible-vibe/core'") &&
      line.includes('import {')
    ) {
      // Extract imports
      const match = line.match(
        /import\s*{([^}]+)}\s*from\s*'@responsible-vibe\/core'/
      );
      if (match) {
        const imports = match[1].split(',').map(s => s.trim());
        const coreImports = [];
        const localImports = [];

        for (const imp of imports) {
          if (serverTypes.includes(imp)) {
            localImports.push(imp);
          } else {
            coreImports.push(imp);
          }
        }

        // Add separate import lines
        if (coreImports.length > 0) {
          newLines.push(
            `import { ${coreImports.join(', ')} } from '@responsible-vibe/core';`
          );
        }
        if (localImports.length > 0) {
          newLines.push(
            `import { ${localImports.join(', ')} } from '${typesPath}';`
          );
        }
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  writeFileSync(filePath, newLines.join('\n'));
}

// Fix resource handlers
const resourceHandlers = readdirSync(
  'packages/mcp-server/src/resource-handlers'
)
  .filter(f => f.endsWith('.ts'))
  .map(f => join('packages/mcp-server/src/resource-handlers', f));

for (const file of resourceHandlers) {
  fixImports(file, '../types.js');
  console.log(`Fixed ${file}`);
}

// Fix tool handlers
const toolHandlers = readdirSync('packages/mcp-server/src/tool-handlers')
  .filter(f => f.endsWith('.ts'))
  .map(f => join('packages/mcp-server/src/tool-handlers', f));

for (const file of toolHandlers) {
  fixImports(file, '../types.js');
  console.log(`Fixed ${file}`);
}

// Fix other files
const otherFiles = [
  'packages/mcp-server/src/response-renderer.ts',
  'packages/mcp-server/src/server-config.ts',
  'packages/mcp-server/src/server-helpers.ts',
  'packages/mcp-server/src/server-implementation.ts',
];

for (const file of otherFiles) {
  fixImports(file, './types.js');
  console.log(`Fixed ${file}`);
}

console.log('All imports fixed!');
