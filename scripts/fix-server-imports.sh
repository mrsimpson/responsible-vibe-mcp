#!/bin/bash

# Fix resource handlers
find packages/mcp-server/src/resource-handlers -name "*.ts" -exec sed -i '' 's|} from '\''@responsible-vibe/core'\'';|} from '\''../types.js'\'';|g' {} \;

# Fix tool handlers  
find packages/mcp-server/src/tool-handlers -name "*.ts" -exec sed -i '' 's|} from '\''@responsible-vibe/core'\'';|} from '\''../types.js'\'';|g' {} \;

# Fix other server files
sed -i '' 's|} from '\''@responsible-vibe/core'\'';|} from '\''./types.js'\'';|g' packages/mcp-server/src/response-renderer.ts
sed -i '' 's|} from '\''@responsible-vibe/core'\'';|} from '\''./types.js'\'';|g' packages/mcp-server/src/server-config.ts
sed -i '' 's|} from '\''@responsible-vibe/core'\'';|} from '\''./types.js'\'';|g' packages/mcp-server/src/server-helpers.ts
sed -i '' 's|} from '\''@responsible-vibe/core'\'';|} from '\''./types.js'\'';|g' packages/mcp-server/src/server-implementation.ts

echo "Fixed server type imports"
