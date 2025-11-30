# MCP over HTTP Integration Investigation

**Date**: 2025-11-30
**Status**: Investigation Phase
**Goal**: Explore options for providing responsible-vibe-mcp features via MCP over HTTP with centrally provisioned workflows and local plan files

## Executive Summary

This document investigates architectural options for extending the responsible-vibe-mcp server to support MCP over HTTP transport, enabling:

1. **Central workflow provisioning** - Workflows managed and distributed from a central service
2. **Local plan file persistence** - Development plans remain on user's disk
3. **Multi-user scalability** - Support for multiple concurrent users/projects
4. **Hybrid transport support** - Both stdio (current) and HTTP transports

## Current State Analysis

### Architecture Strengths for HTTP Integration

✅ **Transport-agnostic core**: Server logic is cleanly separated from transport layer
✅ **File-based persistence**: Already uses local file storage (`.vibe/` directory)
✅ **Modular design**: Tool and resource handlers use well-defined interfaces
✅ **MCP SDK support**: `@modelcontextprotocol/sdk` v1.17.5 supports multiple transports
✅ **Stateless operation**: Server doesn't store conversation history - perfect for HTTP

### Current Limitations

❌ **Only stdio transport**: No HTTP/SSE implementation exists
❌ **Single-project context**: Designed for one project per server instance
❌ **Local workflows only**: Workflows loaded from local filesystem/resources
❌ **No authentication**: No auth layer (not needed for stdio)
❌ **No multi-tenancy**: No project/user isolation for concurrent sessions

## MCP over HTTP: Protocol Overview

### Streamable HTTP Transport (MCP Spec 2025-06-18)

The latest MCP specification (as of June 2025) uses **Streamable HTTP** which replaced the earlier SSE transport:

**Key Characteristics:**
- HTTP POST requests to send JSON-RPC messages
- Optional Server-Sent Events (SSE) for streaming responses
- HTTP GET requests to open SSE streams for server-initiated messages
- Bidirectional communication support
- Content-Type negotiation: `application/json` or `text/event-stream`

**Client Request Pattern:**
```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream

{JSON-RPC message}
```

**Server Response Options:**
1. **Single response**: `Content-Type: application/json` + single JSON object
2. **Streaming response**: `Content-Type: text/event-stream` + SSE stream

**SSE Stream Pattern:**
```http
GET /mcp HTTP/1.1
Accept: text/event-stream
```

## Architecture Options for HTTP Integration

### Option 1: Dual-Transport Server

**Description**: Run both stdio and HTTP transports simultaneously from the same server instance

**Architecture:**
```
┌─────────────────────────────────────────┐
│   Responsible Vibe MCP Server Core      │
│  ┌────────────────────────────────────┐ │
│  │  Server Implementation             │ │
│  │  (ServerContext, Managers, etc)    │ │
│  └────────────────────────────────────┘ │
│              ▲         ▲                 │
│              │         │                 │
│  ┌───────────┴─┐   ┌──┴──────────────┐  │
│  │  Stdio      │   │  HTTP Transport  │  │
│  │  Transport  │   │  (Express/Fastify)│ │
│  └─────────────┘   └──────────────────┘  │
└─────────────────────────────────────────┘
           │                    │
           ▼                    ▼
    Local Agent         Remote Clients
```

**Pros:**
- Clean separation of concerns
- Maintains backward compatibility with stdio
- Reuses all existing business logic
- Can be deployed as both local and remote service

**Cons:**
- More complex startup/configuration
- Need to manage multiple transport lifecycles
- Port/network configuration for HTTP

**Implementation Approach:**
1. Create new `HttpServerTransport` class
2. Instantiate same `ResponsibleVibeMCPServer` core
3. Route HTTP requests to core tool handlers
4. Add transport selection via environment variable

---

### Option 2: Separate HTTP Service

**Description**: Create a dedicated HTTP-only MCP server as a separate package/deployment

**Architecture:**
```
┌────────────────────┐      ┌─────────────────────┐
│  Local Stdio       │      │  HTTP MCP Service   │
│  MCP Server        │      │  (Cloud/Remote)     │
│                    │      │                     │
│  @responsible-vibe │      │  @responsible-vibe/ │
│  /mcp-server       │      │  mcp-http-server    │
└────────────────────┘      └─────────────────────┘
         │                            │
         ▼                            ▼
    Local Agent                 Remote Clients
         │                            │
         └──────────┬─────────────────┘
                    ▼
           Shared Core Package
           (@responsible-vibe/core)
```

**Pros:**
- Clear separation between local and remote use cases
- Optimized for specific deployment scenarios
- Easier to add HTTP-specific features (auth, rate limiting, etc.)
- Independent versioning and scaling

**Cons:**
- Code duplication for server setup
- Need to maintain two deployment paths
- More packages to manage

**Implementation Approach:**
1. Create new `packages/mcp-http-server/` package
2. Share `@responsible-vibe/core` business logic
3. Implement HTTP-specific transport layer
4. Add authentication and multi-tenancy support

---

### Option 3: Gateway/Proxy Pattern

**Description**: HTTP gateway that proxies requests to local stdio MCP servers

**Architecture:**
```
┌─────────────────────────────────────────┐
│         HTTP Gateway Service            │
│  ┌────────────────────────────────────┐ │
│  │   Request Router                   │ │
│  │   (projectId → stdio connection)   │ │
│  └────────────────────────────────────┘ │
│              │                           │
│      ┌───────┼───────┐                  │
│      ▼       ▼       ▼                  │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │stdio│ │stdio│ │stdio│  MCP Servers  │
│  └─────┘ └─────┘ └─────┘               │
└─────────────────────────────────────────┘
              │
              ▼
      HTTP Clients
```

**Pros:**
- No changes to existing MCP server code
- Easy to add/remove project instances
- Natural isolation between projects
- Can leverage existing MCP tools for process management

**Cons:**
- Additional layer of indirection
- More complex deployment and monitoring
- Process management overhead
- Higher resource consumption (one process per project)

**Implementation Approach:**
1. Create HTTP server that spawns stdio MCP processes
2. Maintain process pool keyed by projectId
3. Route incoming HTTP requests to appropriate process
4. Handle process lifecycle and cleanup

## Central Workflow Provisioning Strategies

### Strategy 1: Workflow Registry Service

**Description**: Central HTTP service that serves workflow definitions

**Architecture:**
```
┌──────────────────────────────────┐
│   Workflow Registry Service      │
│                                  │
│  GET /workflows                  │
│  GET /workflows/{name}           │
│  GET /workflows/by-domain/{domain}│
│                                  │
│  Database/Storage:               │
│  - Workflow YAML definitions     │
│  - Metadata (domain, complexity) │
│  - Versioning information        │
└──────────────────────────────────┘
              │
              ▼ (HTTP requests)
┌──────────────────────────────────┐
│   MCP Server (HTTP or stdio)     │
│                                  │
│  WorkflowManager:                │
│  - Fetch from registry on demand │
│  - Cache locally (optional)      │
│  - Fallback to local workflows   │
└──────────────────────────────────┘
```

**Benefits:**
- Centralized workflow management
- Easy updates and versioning
- Can track workflow usage analytics
- Support for organization-specific workflows

**Implementation:**
- REST API for workflow discovery and retrieval
- WorkflowManager enhanced to support remote sources
- Caching layer to reduce network calls
- Fallback to local workflows when registry unavailable

**API Design:**
```typescript
// Workflow Registry API
GET /api/v1/workflows
  ?domain=feature|bugfix|analysis
  &complexity=simple|moderate|complex

Response: {
  workflows: [
    {
      name: "epcc",
      version: "1.0.0",
      domain: "feature",
      complexity: "moderate",
      metadata: {...},
      url: "/api/v1/workflows/epcc"
    }
  ]
}

GET /api/v1/workflows/{name}
  ?version=1.0.0  // optional, defaults to latest

Response: {
  name: "epcc",
  version: "1.0.0",
  definition: { /* YAML/JSON workflow definition */ },
  checksum: "sha256:..."
}
```

---

### Strategy 2: Workflow Packages via NPM

**Description**: Publish workflows as separate npm packages

**Architecture:**
```
┌─────────────────────────────────┐
│   NPM Registry                  │
│                                 │
│  @responsible-vibe/workflow-*   │
│  - workflow-epcc                │
│  - workflow-tdd                 │
│  - workflow-waterfall           │
│  - workflow-{custom-org}        │
└─────────────────────────────────┘
              │
              ▼ (npm install)
┌─────────────────────────────────┐
│   MCP Server                    │
│                                 │
│  node_modules/                  │
│    @responsible-vibe/           │
│      workflow-*/workflows/      │
└─────────────────────────────────┘
```

**Benefits:**
- Leverages existing package ecosystem
- Version management via semver
- Organizations can publish private workflow packages
- Standard dependency management

**Implementation:**
- Split workflows into individual packages
- WorkflowManager scans `node_modules/@responsible-vibe/workflow-*/`
- Support for private npm registries
- Workflow updates via standard `npm update`

---

### Strategy 3: Git-Based Workflow Distribution

**Description**: Workflows stored in Git repositories, fetched on-demand

**Architecture:**
```
┌─────────────────────────────────┐
│   Git Repository                │
│   (github.com/org/workflows)    │
│                                 │
│   workflows/                    │
│     epcc.yaml                   │
│     tdd.yaml                    │
│     custom-org-workflow.yaml    │
└─────────────────────────────────┘
              │
              ▼ (git clone/fetch)
┌─────────────────────────────────┐
│   MCP Server                    │
│                                 │
│   .vibe/workflows/              │
│     {org}/{repo}/               │
└─────────────────────────────────┘
```

**Benefits:**
- Version control built-in
- Easy contribution workflow (PRs)
- Organizations can fork and customize
- No additional infrastructure needed

**Implementation:**
- Support workflow URLs: `git+https://github.com/org/workflows.git#branch`
- Clone workflows to `.vibe/workflows/remote/`
- Periodic fetch for updates
- Allow local overrides

---

### Strategy 4: Hybrid Approach (Recommended)

**Description**: Combine multiple strategies with priority/fallback

**Priority Order:**
1. Project-local workflows (`.vibe/workflows/`)
2. Organization workflow registry (HTTP API)
3. NPM packages (`@responsible-vibe/workflow-*`)
4. Built-in workflows (`resources/workflows/`)

**Configuration:**
```json
{
  "workflowSources": [
    {
      "type": "local",
      "path": ".vibe/workflows"
    },
    {
      "type": "registry",
      "url": "https://workflows.company.com/api/v1",
      "apiKey": "${WORKFLOW_REGISTRY_API_KEY}"
    },
    {
      "type": "npm",
      "scope": "@company"
    },
    {
      "type": "builtin"
    }
  ]
}
```

**Benefits:**
- Maximum flexibility
- Gradual migration path
- Supports all use cases
- Graceful degradation

## Local Plan File Management

### Current Implementation

Plan files are already stored locally:
- Location: `{projectPath}/.vibe/development-plan-{branch}.md`
- Format: Markdown with task lists and decision logs
- Managed by: `PlanManager` class

### HTTP Integration Considerations

**Challenge**: How does a remote HTTP server manage files on a user's local disk?

**Solution Options:**

#### Option A: Client-Side Plan File Management

**Description**: HTTP clients are responsible for reading/writing plan files locally

**Flow:**
```
1. Client calls whats_next() tool via HTTP
2. Server returns instructions including plan file operations
3. Client reads/writes plan file on local disk
4. Client includes plan file content in subsequent requests
```

**Pros:**
- Plan files remain fully local
- Server remains stateless
- No security concerns about server accessing client filesystem
- Works with existing client-side agents (Claude Desktop, etc.)

**Cons:**
- More complex client implementation
- Clients must understand plan file format
- Potential for client-server plan file format drift

**Implementation:**
```typescript
// Server response includes plan file operations
{
  "instructions": "...",
  "planFileOperations": [
    {
      "type": "update",
      "path": ".vibe/development-plan-main.md",
      "section": "Implementation",
      "content": "- [x] Complete feature X\n- [ ] Add tests"
    }
  ]
}

// Client is responsible for applying these operations
```

---

#### Option B: Server-Initiated File Operations via MCP Resources

**Description**: Use MCP's resource protocol to allow server to request file operations

**Flow:**
```
1. Server provides `plan://current` resource
2. Client can read/subscribe to resource
3. Server sends resource update notifications
4. Client applies updates to local filesystem
```

**Pros:**
- Leverages MCP's resource model
- Server controls plan file structure
- Consistent with current resource-based architecture

**Cons:**
- Requires client support for resource subscriptions
- Still requires client to perform actual file I/O
- May not be supported by all MCP clients

---

#### Option C: Agent File Access MCP Server

**Description**: User runs a separate "file access" MCP server locally that the HTTP server calls

**Architecture:**
```
┌──────────────────┐      ┌─────────────────────┐
│  Remote HTTP     │      │  Local File Access  │
│  MCP Server      │─────▶│  MCP Server         │
│                  │ HTTP │  (stdio)            │
└──────────────────┘      └─────────────────────┘
                                     │
                                     ▼
                              User's Local Disk
                              (.vibe/development-plan-*.md)
```

**Flow:**
1. User runs local file-access MCP server (stdio)
2. User registers file-access server endpoint with HTTP MCP server
3. HTTP MCP server calls file-access server to read/write plan files
4. File-access server performs operations on user's local disk

**Pros:**
- Clean separation of concerns
- HTTP server can still manage plan files
- User maintains full control over file access
- Secure via authentication tokens

**Cons:**
- Additional complexity (two MCP servers)
- Network overhead for file operations
- Need to handle connectivity issues

---

#### Option D: Plan Files as MCP Context (Recommended for HTTP)

**Description**: Plan files become part of the conversation context, stored/managed by client

**Flow:**
```
1. Client maintains plan file locally
2. Client includes current plan file content in whats_next() calls
3. Server returns updated plan file content in response
4. Client writes updated plan file to disk
5. Plan file becomes part of "conversation context" pattern
```

**Implementation:**
```typescript
// Enhanced whats_next() tool for HTTP mode
interface WhatsNextArgs {
  context: string;
  user_input: string;
  conversation_summary: string;
  recent_messages: Message[];
  current_plan_file?: string;  // NEW: current plan content
}

interface WhatsNextResponse {
  instructions: string;
  updated_plan_file?: string;  // NEW: updated plan content
  metadata: {...}
}
```

**Pros:**
- Aligns with existing stateless architecture
- No special file access mechanisms needed
- Plan file changes are explicit and traceable
- Works with any HTTP client

**Cons:**
- Larger request/response payloads
- Plan file in every request (can optimize with diffs)
- Client must implement plan file persistence

**Optimization**: Use diffs instead of full content
```typescript
{
  "plan_file_delta": {
    "format": "unified-diff",
    "patch": "@@ -12,3 +12,4 @@\n+- [x] New completed task"
  }
}
```

## Multi-Tenancy and Session Management

### Challenge: Supporting Multiple Concurrent Users/Projects

**Requirements:**
- Isolate conversation state between users/projects
- Route requests to correct conversation context
- Maintain security boundaries
- Scale to many concurrent sessions

### Solution: Session-Based Routing

**Session Identification:**
```typescript
interface SessionIdentifier {
  userId: string;           // Authenticated user ID
  projectId: string;        // Project identifier
  gitBranch?: string;       // Optional branch isolation
}

// Conversation ID becomes:
// {userId}/{projectId}/{gitBranch}
```

**HTTP Request Pattern:**
```http
POST /mcp HTTP/1.1
Authorization: Bearer {token}
X-Project-ID: project-123
X-Git-Branch: feature/new-feature
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "whats_next",
    "arguments": {...}
  }
}
```

**Session Storage:**
- Current: `.vibe/conversations/{conversationId}/`
- HTTP Mode: Server-side storage (database, S3, etc.)
- Option: Hybrid - server stores state, client stores plan files

## Authentication and Authorization

### Authentication Options

#### Option 1: API Key Authentication
```http
Authorization: Bearer sk_live_abc123...
```
- Simple to implement
- Good for service-to-service
- Users manage their own keys

#### Option 2: OAuth 2.0 / OIDC
```http
Authorization: Bearer {jwt_token}
```
- Enterprise-friendly
- Supports SSO
- Token-based user identity

#### Option 3: mTLS (Mutual TLS)
- Client certificate authentication
- Strong security
- Good for regulated environments

### Authorization Model

**Resource-Based Access Control:**
```typescript
interface AccessControl {
  userId: string;
  permissions: {
    projects: {
      [projectId: string]: {
        read: boolean;
        write: boolean;
        delete: boolean;
      }
    },
    workflows: {
      [workflowName: string]: {
        use: boolean;
      }
    }
  }
}
```

## Deployment Models

### Model 1: Managed SaaS Service

**Architecture:**
```
┌────────────────────────────────────┐
│   Responsible Vibe Cloud           │
│                                    │
│   ┌──────────────────────────┐    │
│   │  Load Balancer           │    │
│   └──────────┬───────────────┘    │
│              │                     │
│   ┌──────────┴──────────────┐     │
│   │  MCP HTTP Servers        │     │
│   │  (Auto-scaling)          │     │
│   └──────────┬───────────────┘     │
│              │                     │
│   ┌──────────┴──────────────┐     │
│   │  State Storage           │     │
│   │  (PostgreSQL/DynamoDB)   │     │
│   └──────────────────────────┘     │
│                                    │
│   ┌──────────────────────────┐    │
│   │  Workflow Registry        │    │
│   └──────────────────────────┘    │
└────────────────────────────────────┘
              │
              ▼
      Internet Clients
```

**Benefits:**
- No infrastructure management for users
- Central workflow updates
- Usage analytics and monitoring
- Multi-region deployment

**Challenges:**
- Need to build/maintain SaaS infrastructure
- Pricing model required
- Data privacy concerns (conversation state)
- Plan file management complexity

---

### Model 2: Self-Hosted Enterprise

**Architecture:**
```
┌─────────────────────────────────┐
│   Company Internal Network      │
│                                 │
│  ┌──────────────────────────┐  │
│  │  MCP HTTP Server         │  │
│  │  (Docker/K8s)            │  │
│  └──────────┬───────────────┘  │
│             │                  │
│  ┌──────────┴───────────────┐  │
│  │  Internal Workflow       │  │
│  │  Registry                │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  LDAP/SSO                │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

**Benefits:**
- Full control over infrastructure
- Data stays within organization
- Custom workflow management
- Integration with internal tools

**Challenges:**
- Organizations must manage deployment
- Need to provide installation/upgrade tools
- Support burden

---

### Model 3: Hybrid (Recommended)

**Architecture:**
```
┌──────────────────────┐        ┌────────────────────┐
│  Workflow Registry   │        │  User's Machine    │
│  (Cloud SaaS)        │        │                    │
│                      │        │  ┌──────────────┐  │
│  - Workflow catalog  │◀──────▶│  │  MCP Server  │  │
│  - Updates           │        │  │  (HTTP/stdio)│  │
│  - Analytics         │        │  └──────────────┘  │
└──────────────────────┘        │                    │
                                │  - Local state     │
                                │  - Plan files      │
                                └────────────────────┘
```

**Flow:**
1. MCP server runs locally (HTTP or stdio)
2. Fetches workflows from central registry
3. Manages state and plan files locally
4. Can operate offline with cached workflows

**Benefits:**
- Best of both worlds
- Data privacy (local state)
- Central workflow management
- Works offline

## Technical Implementation Roadmap

### Phase 1: HTTP Transport Layer (Foundation)

**Goal**: Add HTTP transport support to existing server

**Tasks:**
1. Implement Streamable HTTP transport handler
   - HTTP POST endpoint for JSON-RPC messages
   - SSE streaming support for long-running operations
   - HTTP GET endpoint for SSE streams
2. Add transport selection mechanism (stdio vs HTTP)
3. Create HTTP server configuration
   - Port, host, CORS settings
   - TLS/SSL support
4. Update entry point to support both transports
5. Add integration tests for HTTP transport

**Deliverable**: `@responsible-vibe/mcp-server` can run in HTTP mode

**Estimated Effort**: 2-3 weeks

---

### Phase 2: Multi-Tenancy Support

**Goal**: Enable concurrent multi-user/project support

**Tasks:**
1. Enhance conversation identification with userId
2. Implement session-based routing
3. Add project isolation to FileStorage
4. Create server-side state storage option
   - Database schema for conversation state
   - Migration from file-based storage
5. Add session management APIs
6. Update ConversationManager for multi-tenant contexts

**Deliverable**: HTTP server supports multiple concurrent users/projects

**Estimated Effort**: 2-3 weeks

---

### Phase 3: Authentication & Authorization

**Goal**: Secure HTTP endpoints

**Tasks:**
1. Implement API key authentication
2. Add JWT token support
3. Create authorization middleware
4. Implement project-level access control
5. Add audit logging
6. Create user management APIs

**Deliverable**: Secure HTTP MCP server with auth

**Estimated Effort**: 2 weeks

---

### Phase 4: Workflow Registry

**Goal**: Central workflow management

**Tasks:**
1. Design workflow registry API
2. Implement workflow registry service
   - REST API for workflow CRUD
   - Versioning support
   - Metadata management
3. Enhance WorkflowManager to support remote sources
4. Add workflow caching layer
5. Implement fallback mechanism
6. Create workflow publishing tools

**Deliverable**: Central workflow registry with API

**Estimated Effort**: 3-4 weeks

---

### Phase 5: Client Plan File Management

**Goal**: Enable plan file management in HTTP mode

**Tasks:**
1. Design plan file protocol for HTTP
2. Implement plan file diff/patch support
3. Update tool responses to include plan file operations
4. Create client-side plan file helpers
5. Add plan file synchronization mechanisms
6. Document client integration patterns

**Deliverable**: Standardized plan file management for HTTP clients

**Estimated Effort**: 2 weeks

---

### Phase 6: Deployment & Operations

**Goal**: Production-ready deployment

**Tasks:**
1. Create Docker images
2. Add Kubernetes manifests
3. Implement health check endpoints
4. Add metrics and monitoring
5. Create deployment documentation
6. Set up CI/CD for releases
7. Create migration tools (stdio → HTTP)

**Deliverable**: Production-ready deployment artifacts

**Estimated Effort**: 2-3 weeks

## Security Considerations

### Data Privacy

**Concern**: Conversation state and plan files may contain sensitive information

**Mitigations:**
- **Encryption at rest**: Encrypt state storage database
- **Encryption in transit**: TLS/HTTPS mandatory for HTTP transport
- **Data retention policies**: Configurable state cleanup
- **User data isolation**: Strong tenant boundaries
- **Audit logging**: Track all data access

### Authentication Security

**Best Practices:**
- Rate limiting on auth endpoints
- Token rotation/expiration
- Secure token storage
- Multi-factor authentication support (enterprise)
- API key scoping (read vs write permissions)

### Input Validation

**Requirements:**
- Validate all JSON-RPC messages
- Sanitize file paths (prevent directory traversal)
- Validate project identifiers
- Rate limit tool calls
- Implement request size limits

### Network Security

**Measures:**
- CORS configuration for browser clients
- DDoS protection
- IP allowlisting (optional)
- VPN/private network support (enterprise)

## Migration Path

### From Current Stdio to HTTP

**Scenario**: User wants to try HTTP mode while maintaining stdio workflows

**Steps:**
1. Install HTTP-enabled version: `npm install responsible-vibe-mcp@latest`
2. Configure HTTP mode: `VIBE_TRANSPORT=http VIBE_HTTP_PORT=3000 npx responsible-vibe-mcp`
3. Existing `.vibe/` data remains compatible
4. Can switch back to stdio anytime
5. Gradual migration of workflows to registry

### Data Migration

**Conversation State:**
- File-based state (`.vibe/conversations/`) remains primary
- Optional migration to server-side database
- Export/import tools for portability

**Workflows:**
- Built-in workflows continue to work
- Gradual addition of registry workflows
- Local workflows always take precedence

## Open Questions & Decisions Needed

### 1. Primary Deployment Model

**Question**: Should we prioritize SaaS, self-hosted, or hybrid?

**Options:**
- **A**: SaaS-first, self-hosted later
- **B**: Self-hosted-first, SaaS optional
- **C**: Hybrid from day one (recommended)

**Recommendation**: **Option C** - Build with hybrid in mind, allows users to choose

---

### 2. Plan File Management Strategy

**Question**: How should plan files be managed in HTTP mode?

**Options:**
- **A**: Client-side only (client stores locally)
- **B**: Server-side only (server manages, client reads)
- **C**: Hybrid (server manages, client persists)

**Recommendation**: **Option C** - Server generates updates, client stores locally, aligns with "plan files on user's disk" requirement

---

### 3. Workflow Distribution

**Question**: What's the primary method for workflow distribution?

**Options:**
- **A**: HTTP Registry only
- **B**: NPM packages only
- **C**: Git repositories only
- **D**: Hybrid with all options (recommended)

**Recommendation**: **Option D** - Support multiple sources with fallback priority

---

### 4. Pricing Model (if SaaS)

**Question**: How to price hosted service?

**Options:**
- **A**: Free tier + paid plans
- **B**: Open source (self-host), paid support
- **C**: Freemium (free public workflows, paid private/custom)

**Recommendation**: **Option B** or **C** - Align with open source nature

---

### 5. Backward Compatibility

**Question**: Should stdio mode continue to be supported?

**Answer**: **YES** - Many users prefer local-only operation, stdio remains first-class transport

## Recommended Next Steps

### Immediate Actions (Investigation Phase)

1. **✅ This document** - Review and validate approach
2. **Create technical proof-of-concept**:
   - Basic HTTP transport implementation
   - Single-user HTTP server
   - Plan file management pattern
3. **Validate MCP SDK capabilities**:
   - Test Streamable HTTP transport
   - Understand SSE streaming requirements
   - Verify JSON-RPC compatibility
4. **Design workflow registry API**:
   - REST API specification
   - Workflow versioning model
   - Authentication scheme

### Short-term (Prototype Phase - 4-6 weeks)

1. Implement Phase 1 (HTTP Transport Layer)
2. Create minimal workflow registry
3. Build proof-of-concept client
4. Test end-to-end flow
5. Document HTTP integration patterns

### Medium-term (MVP Phase - 2-3 months)

1. Complete Phases 2-4 (Multi-tenancy, Auth, Registry)
2. Create deployment artifacts (Docker, K8s)
3. Build client SDKs/helpers
4. Comprehensive testing
5. Beta release with selected users

### Long-term (Production Phase - 6+ months)

1. Complete Phase 5-6 (Client integration, Operations)
2. Production hardening
3. Performance optimization
4. Monitoring and observability
5. Public release
6. Enterprise features (SSO, audit, compliance)

## Success Criteria

### Technical Success

- ✅ HTTP transport fully functional with MCP spec compliance
- ✅ Multi-user support with strong isolation
- ✅ Central workflow provisioning operational
- ✅ Plan files remain on user's disk
- ✅ Backward compatible with stdio mode
- ✅ No breaking changes to existing workflows

### User Success

- ✅ Easy setup for HTTP mode (< 5 minutes)
- ✅ Transparent workflow updates from registry
- ✅ Clear documentation and examples
- ✅ Migration path from stdio to HTTP
- ✅ Performance parity with stdio mode

### Business Success

- ✅ Enable new deployment models (SaaS, enterprise)
- ✅ Workflow marketplace potential
- ✅ Organization-specific workflow support
- ✅ Analytics and usage insights
- ✅ Community adoption and contributions

## References

### MCP Specification
- [MCP Transports (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [Why MCP Moved to Streamable HTTP](https://blog.fka.dev/blog/2025-06-06-why-mcp-deprecated-sse-and-go-with-streamable-http/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)

### Current Architecture
- [ARCHITECTURE.md](../docs/dev/ARCHITECTURE.md)
- [Workflow Manager](../../../packages/core/src/workflow-manager.ts)
- [File Storage](../../../packages/core/src/file-storage.ts)
- [Server Implementation](../../../packages/mcp-server/src/server-implementation.ts)

### Related Technologies
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
- [Express.js](https://expressjs.com/) or [Fastify](https://www.fastify.io/)

---

**Document Status**: Draft for Review
**Next Review**: After stakeholder feedback
**Owner**: Architecture Team
