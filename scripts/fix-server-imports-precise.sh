#!/bin/bash

# Server types that should be imported from local types.js
SERVER_TYPES="ResourceHandler|ServerContext|HandlerResult|ResourceContent|McpToolResponse|McpResourceResponse|ServerConfig|ToolRegistry|ResourceRegistry|ResponseRenderer"

# Function to fix imports in a file
fix_file() {
    local file="$1"
    local types_path="$2"
    
    # Check if file has server types imported from @responsible-vibe/core
    if grep -q "from '@responsible-vibe/core'" "$file" && grep -E "$SERVER_TYPES" "$file"; then
        # Create temp file with fixed imports
        python3 -c "
import re
import sys

with open('$file', 'r') as f:
    content = f.read()

# Find import blocks from @responsible-vibe/core
import_pattern = r'import\s*{([^}]+)}\s*from\s*['\''\"']@responsible-vibe/core['\''\"'];'
matches = re.findall(import_pattern, content)

for match in matches:
    imports = [imp.strip() for imp in match.split(',')]
    server_imports = []
    core_imports = []
    
    server_types = ['ResourceHandler', 'ServerContext', 'HandlerResult', 'ResourceContent', 
                   'McpToolResponse', 'McpResourceResponse', 'ServerConfig', 'ToolRegistry', 
                   'ResourceRegistry', 'ResponseRenderer']
    
    for imp in imports:
        if imp in server_types:
            server_imports.append(imp)
        else:
            core_imports.append(imp)
    
    # Replace the original import
    old_import = f'import {{{match}}} from \'@responsible-vibe/core\';'
    new_imports = []
    
    if core_imports:
        new_imports.append(f'import {{{", ".join(core_imports)}}} from \'@responsible-vibe/core\';')
    if server_imports:
        new_imports.append(f'import {{{", ".join(server_imports)}}} from \'$types_path\';')
    
    content = content.replace(old_import, '\n'.join(new_imports))

with open('$file', 'w') as f:
    f.write(content)
"
    fi
}

# Fix resource handlers
for file in packages/mcp-server/src/resource-handlers/*.ts; do
    fix_file "$file" "../types.js"
done

# Fix tool handlers
for file in packages/mcp-server/src/tool-handlers/*.ts; do
    fix_file "$file" "../types.js"
done

# Fix other server files
fix_file "packages/mcp-server/src/response-renderer.ts" "./types.js"
fix_file "packages/mcp-server/src/server-config.ts" "./types.js"
fix_file "packages/mcp-server/src/server-helpers.ts" "./types.js"
fix_file "packages/mcp-server/src/server-implementation.ts" "./types.js"

echo "Fixed server type imports precisely"
