# MCP over HTTP - Proof of Concept

**Goal**: Validate technical feasibility of HTTP transport with minimal implementation
**Duration**: 1-2 days
**Status**: Proposed

## Objectives

1. ✅ Verify MCP SDK supports Streamable HTTP transport
2. ✅ Confirm existing server core works with HTTP transport
3. ✅ Test JSON-RPC message handling over HTTP
4. ✅ Validate plan file delta approach
5. ✅ Prove backward compatibility with stdio

## Proof of Concept Scope

### In Scope

- Basic HTTP server with single endpoint
- JSON-RPC request/response handling
- One tool call (`whats_next`) working via HTTP
- Simple client test script
- Side-by-side comparison with stdio

### Out of Scope

- Authentication/authorization
- SSE streaming
- Multi-tenancy
- Workflow registry
- Production hardening
- Error handling beyond basics

## Implementation Plan

### Step 1: Create HTTP Transport Module

**File**: `packages/mcp-server/src/transports/http-transport-poc.ts`

```typescript
import express, { Express } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

/**
 * Proof of concept HTTP transport for MCP server
 * Implements basic Streamable HTTP (no SSE streaming yet)
 */
export class HttpTransportPoC implements Transport {
  private app: Express;
  private server?: any;
  private mcpServer?: Server;
  private port: number;
  private host: string;

  constructor(options: { port: number; host?: string }) {
    this.port = options.port;
    this.host = options.host || 'localhost';
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());

    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', transport: 'http' });
    });

    // Main MCP endpoint
    this.app.post('/mcp', async (req, res) => {
      try {
        console.log('Received JSON-RPC request:', JSON.stringify(req.body, null, 2));

        // For PoC, manually route to whats_next
        if (req.body.method === 'tools/call' && req.body.params?.name === 'whats_next') {
          // This would normally go through MCP server's tool handler
          // For PoC, we'll create a mock response
          const response = {
            jsonrpc: '2.0',
            id: req.body.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    instructions: `[PoC] You are in the ${req.body.params.arguments.context || 'unknown'} phase.

This is a proof-of-concept HTTP response. In production, this would:
1. Call the real whats_next tool handler
2. Return actual phase-specific instructions
3. Include plan file operations
4. Support SSE streaming for long responses

For now, this validates that:
✅ HTTP transport works
✅ JSON-RPC messages are handled
✅ Tool calls can be routed
✅ Responses are returned correctly`,
                    current_phase: 'poc-phase',
                    metadata: {
                      transport: 'http',
                      timestamp: new Date().toISOString()
                    }
                  })
                }
              ]
            }
          };

          console.log('Sending response:', JSON.stringify(response, null, 2));
          res.json(response);
        } else {
          res.status(400).json({
            jsonrpc: '2.0',
            id: req.body.id,
            error: {
              code: -32601,
              message: `Method not implemented in PoC: ${req.body.method}`
            }
          });
        }
      } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body.id,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error)
          }
        });
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, this.host, () => {
        console.log(`[PoC] HTTP MCP server listening on http://${this.host}:${this.port}`);
        console.log(`[PoC] Health check: http://${this.host}:${this.port}/health`);
        console.log(`[PoC] MCP endpoint: http://${this.host}:${this.port}/mcp`);
        resolve();
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Transport interface methods (simplified for PoC)
  async send(message: any): Promise<void> {
    console.log('[PoC] Transport.send called:', message);
  }

  onmessage?: (message: any) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;
}
```

### Step 2: Create PoC Entry Point

**File**: `packages/mcp-server/src/poc-http-server.ts`

```typescript
#!/usr/bin/env node

import { HttpTransportPoC } from './transports/http-transport-poc.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || 'localhost';

console.log('='.repeat(60));
console.log('  MCP over HTTP - Proof of Concept');
console.log('='.repeat(60));
console.log();

const transport = new HttpTransportPoC({ port: PORT, host: HOST });

transport.start().then(() => {
  console.log();
  console.log('PoC server is ready!');
  console.log();
  console.log('Test it with:');
  console.log(`  curl -X POST http://${HOST}:${PORT}/mcp \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '${JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'whats_next',
      arguments: {
        context: 'requirements',
        user_input: 'What should I do next?'
      }
    }
  })}'`);
  console.log();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down...');
  await transport.close();
  process.exit(0);
});
```

### Step 3: Create Test Client

**File**: `packages/mcp-server/src/test-http-client.ts`

```typescript
#!/usr/bin/env node

/**
 * Simple test client for HTTP MCP PoC
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function testHealthCheck() {
  console.log('\n📡 Testing health check...');
  const response = await fetch(`${SERVER_URL}/health`);
  const data = await response.json();
  console.log('✅ Health check:', data);
}

async function testWhatsNext() {
  console.log('\n📡 Testing whats_next tool...');

  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'whats_next',
      arguments: {
        context: 'Starting a new feature',
        user_input: 'I want to build a user authentication system',
        conversation_summary: 'New project, no existing work',
        recent_messages: []
      }
    }
  };

  console.log('Request:', JSON.stringify(request, null, 2));

  const response = await fetch(`${SERVER_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (data.result?.content?.[0]?.text) {
    const parsed = JSON.parse(data.result.content[0].text);
    console.log('\n📋 Instructions:');
    console.log(parsed.instructions);
  }
}

async function testPlanFileDelta() {
  console.log('\n📡 Testing plan file delta approach...');

  // Simulate a scenario where plan file needs updating
  const currentPlanContent = `# Development Plan

## Requirements
- [x] Gather user requirements
- [ ] Define acceptance criteria

## Design
- [ ] Create architecture diagram
- [ ] Design database schema
`;

  const request = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'whats_next',
      arguments: {
        context: 'Working on design phase',
        user_input: 'I completed the architecture diagram',
        current_plan_summary: 'Requirements done, working on design',
        // In real implementation, we'd send this:
        // current_plan_content: currentPlanContent
      }
    }
  };

  console.log('Request (with plan context):', JSON.stringify(request, null, 2));

  const response = await fetch(`${SERVER_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  console.log('\n📝 Expected behavior:');
  console.log('Server should return plan_file_operations like:');
  console.log(JSON.stringify({
    plan_file_operations: [
      {
        type: 'mark_complete',
        section: 'Design',
        task: 'Create architecture diagram'
      }
    ]
  }, null, 2));
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('  MCP over HTTP - Client Test Suite');
  console.log('='.repeat(60));

  try {
    await testHealthCheck();
    await testWhatsNext();
    await testPlanFileDelta();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
```

### Step 4: Plan File Delta Example

**File**: `packages/mcp-server/src/plan-file-delta-example.ts`

```typescript
/**
 * Example of how plan file delta/patch approach would work
 */

interface PlanFileOperation {
  type: 'mark_complete' | 'mark_incomplete' | 'add_task' | 'remove_task' | 'add_decision' | 'update_section';
  section?: string;
  task?: string;
  content?: string;
}

interface PlanFileDelta {
  file: string;
  operations: PlanFileOperation[];
}

/**
 * Apply plan file operations to markdown content
 */
function applyPlanFileDelta(currentContent: string, delta: PlanFileDelta): string {
  let updatedContent = currentContent;

  for (const op of delta.operations) {
    switch (op.type) {
      case 'mark_complete':
        // Find "- [ ] task" and replace with "- [x] task"
        if (op.task) {
          const pattern = new RegExp(`- \\[ \\] ${escapeRegex(op.task)}`, 'g');
          updatedContent = updatedContent.replace(pattern, `- [x] ${op.task}`);
        }
        break;

      case 'mark_incomplete':
        // Find "- [x] task" and replace with "- [ ] task"
        if (op.task) {
          const pattern = new RegExp(`- \\[x\\] ${escapeRegex(op.task)}`, 'g');
          updatedContent = updatedContent.replace(pattern, `- [ ] ${op.task}`);
        }
        break;

      case 'add_task':
        // Find section and add task
        if (op.section && op.task) {
          const sectionPattern = new RegExp(`## ${escapeRegex(op.section)}`, 'g');
          updatedContent = updatedContent.replace(
            sectionPattern,
            `## ${op.section}\n- [ ] ${op.task}`
          );
        }
        break;

      case 'add_decision':
        // Add to Key Decisions section
        if (op.content) {
          const decisionsPattern = /## Key Decisions/g;
          updatedContent = updatedContent.replace(
            decisionsPattern,
            `## Key Decisions\n- ${op.content}`
          );
        }
        break;

      // ... more operation types
    }
  }

  return updatedContent;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Example usage
const currentPlan = `# Development Plan

## Requirements
- [x] Gather user requirements
- [ ] Define acceptance criteria

## Design
- [ ] Create architecture diagram
- [ ] Design database schema

## Key Decisions
`;

const delta: PlanFileDelta = {
  file: '.vibe/development-plan-main.md',
  operations: [
    {
      type: 'mark_complete',
      section: 'Design',
      task: 'Create architecture diagram'
    },
    {
      type: 'add_decision',
      content: 'Decided to use PostgreSQL for user data'
    },
    {
      type: 'add_task',
      section: 'Implementation',
      task: 'Set up database connection'
    }
  ]
};

const updatedPlan = applyPlanFileDelta(currentPlan, delta);

console.log('='.repeat(60));
console.log('Plan File Delta Example');
console.log('='.repeat(60));
console.log('\nOriginal Plan:');
console.log(currentPlan);
console.log('\nDelta Operations:');
console.log(JSON.stringify(delta, null, 2));
console.log('\nUpdated Plan:');
console.log(updatedPlan);
```

## Running the Proof of Concept

### Setup

```bash
# Navigate to mcp-server package
cd packages/mcp-server

# Install dependencies (if needed)
pnpm install

# Add express for PoC
pnpm add express @types/express
```

### Run the Server

```bash
# Start PoC HTTP server
PORT=3000 tsx src/poc-http-server.ts
```

Expected output:
```
============================================================
  MCP over HTTP - Proof of Concept
============================================================

[PoC] HTTP MCP server listening on http://localhost:3000
[PoC] Health check: http://localhost:3000/health
[PoC] MCP endpoint: http://localhost:3000/mcp

PoC server is ready!

Test it with:
  curl -X POST http://localhost:3000/mcp ...
```

### Run the Test Client

In another terminal:

```bash
# Run test client
tsx src/test-http-client.ts
```

Expected output:
```
============================================================
  MCP over HTTP - Client Test Suite
============================================================

📡 Testing health check...
✅ Health check: { status: 'ok', transport: 'http' }

📡 Testing whats_next tool...
Request: { ... }
Response: { ... }

📋 Instructions:
[PoC] You are in the Starting a new feature phase...
✅ HTTP transport works
✅ JSON-RPC messages are handled
...

============================================================
✅ All tests completed!
============================================================
```

### Test with curl

```bash
# Health check
curl http://localhost:3000/health

# whats_next tool call
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "whats_next",
      "arguments": {
        "context": "requirements",
        "user_input": "What should I do next?"
      }
    }
  }'
```

### Test Plan File Delta

```bash
# Run plan file delta example
tsx src/plan-file-delta-example.ts
```

## Validation Checklist

After running the PoC, verify:

- [ ] HTTP server starts successfully
- [ ] Health check endpoint returns 200 OK
- [ ] POST /mcp accepts JSON-RPC messages
- [ ] whats_next tool call returns valid response
- [ ] Response follows MCP protocol format
- [ ] curl commands work as expected
- [ ] Test client runs successfully
- [ ] Plan file delta approach is workable
- [ ] No conflicts with existing stdio transport

## Success Criteria

The PoC is successful if:

1. ✅ HTTP server receives and processes MCP tool calls
2. ✅ JSON-RPC format is correctly handled
3. ✅ Responses are formatted according to MCP spec
4. ✅ Plan file delta approach is feasible
5. ✅ No major blockers identified

## Next Steps After PoC

If PoC is successful:

1. **Review findings** with team
2. **Document learnings** and gotchas
3. **Refine Phase 1 plan** based on PoC results
4. **Get approval** to proceed with full implementation
5. **Start Phase 1** with confidence

If PoC reveals issues:

1. **Document blockers**
2. **Explore alternatives**
3. **Adjust approach** as needed
4. **Iterate on PoC** until viable

## Known Limitations of PoC

This PoC intentionally skips:

- ❌ Real MCP server integration (uses mock response)
- ❌ SSE streaming for long responses
- ❌ Authentication/authorization
- ❌ Error handling edge cases
- ❌ Concurrent request handling
- ❌ Production-grade code quality
- ❌ Comprehensive testing

These will be addressed in Phase 1 full implementation.

---

**Status**: Ready to implement
**Estimated Time**: 4-8 hours
**Dependencies**: None (uses existing packages)
