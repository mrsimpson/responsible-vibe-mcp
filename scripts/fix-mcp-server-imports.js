#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const mcpServerDir = join(__dirname, '..', 'packages', 'mcp-server', 'src');

// Server types that should be imported from local types.js
const serverTypes = [
  'ToolHandler',
  'ServerContext',
  'HandlerResult',
  'ResourceHandler',
  'ResourceContent',
  'McpToolResponse',
  'McpResourceResponse',
  'ServerConfig',
  'ToolRegistry',
  'ResourceRegistry',
  'ResponseRenderer',
];

function getAllFiles(dir, extensions = ['.ts']) {
  const files = [];

  function traverse(currentDir) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function fixImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  let newContent = content;
  let changed = false;

  // Fix relative path imports for types.js
  newContent = newContent.replace(
    /from ['"]\.\.\/\.\.\/types\.js['"]/g,
    "from '@responsible-vibe/core'"
  );
  newContent = newContent.replace(
    /from ['"]\.\.\/\.\.\/state-machine-types\.js['"]/g,
    "from '@responsible-vibe/core'"
  );

  // Fix server type imports - replace lines that import server types from @responsible-vibe/core
  const lines = newContent.split('\n');
  const newLines = [];
  let serverTypesToImport = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line imports from @responsible-vibe/core and contains server types
    if (
      line.includes("from '@responsible-vibe/core'") &&
      line.includes('import')
    ) {
      const importMatch = line.match(
        /import\s*{([^}]+)}\s*from\s*'@responsible-vibe\/core'/
      );
      if (importMatch) {
        const imports = importMatch[1].split(',').map(s => s.trim());
        const coreImports = [];

        for (const imp of imports) {
          if (serverTypes.includes(imp)) {
            serverTypesToImport.add(imp);
            changed = true;
          } else {
            coreImports.push(imp);
          }
        }

        // Keep core imports if any remain
        if (coreImports.length > 0) {
          newLines.push(
            `import { ${coreImports.join(', ')} } from '@responsible-vibe/core';`
          );
        }
        // Skip the line if all imports were server types
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  // Add local server types import if needed
  if (serverTypesToImport.size > 0) {
    // Find the right place to insert (after other imports)
    let insertIndex = 0;
    for (let i = 0; i < newLines.length; i++) {
      if (newLines[i].startsWith('import ')) {
        insertIndex = i + 1;
      }
    }

    // Determine relative path to types.js
    const relativePath =
      filePath.includes('/tool-handlers/') ||
      filePath.includes('/resource-handlers/')
        ? '../types.js'
        : './types.js';

    newLines.splice(
      insertIndex,
      0,
      `import { ${Array.from(serverTypesToImport).join(', ')} } from '${relativePath}';`
    );
  }

  return {
    changed,
    newContent: newLines.join('\n'),
  };
}

function main() {
  console.log('🔧 Fixing MCP server imports...\n');

  const allFiles = getAllFiles(mcpServerDir);
  console.log(`📁 Processing ${allFiles.length} files...\n`);

  let filesChanged = 0;

  for (const filePath of allFiles) {
    const result = fixImportsInFile(filePath);

    if (result.changed) {
      writeFileSync(filePath, result.newContent, 'utf8');
      filesChanged++;

      const fileName = filePath.split('/').pop();
      console.log(`✅ ${fileName}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${allFiles.length}`);
  console.log(`   Files changed: ${filesChanged}`);
  console.log('\n🎉 MCP server import fixing complete!');
}

main();
