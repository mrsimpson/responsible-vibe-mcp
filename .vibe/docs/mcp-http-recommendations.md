# MCP over HTTP - Executive Summary & Recommendations

**Date**: 2025-11-30
**Status**: Investigation Complete - Ready for Decision

## Quick Summary

✅ **Feasibility**: Implementing MCP over HTTP is **highly feasible** given the current architecture
✅ **Plan Files**: Can remain on user's disk using client-managed approach
✅ **Central Workflows**: Multiple viable strategies for central workflow provisioning
✅ **Backward Compatibility**: Stdio transport can coexist with HTTP transport

## Key Recommendations

### 1. Architecture: Hybrid Deployment Model ⭐

**Recommendation**: Build a hybrid architecture where the MCP server runs locally (supporting both stdio and HTTP), while workflows are fetched from a central registry.

**Rationale**:
- Maintains data privacy (state and plan files stay local)
- Enables central workflow management
- Works offline with cached workflows
- Supports both local and remote clients
- Aligns with user requirement: "development plan still resides on disk"

**Implementation**:
```
Local MCP Server (Dual Transport)
├── Stdio transport (existing behavior)
├── HTTP transport (new)
├── Local storage (.vibe/)
│   ├── conversations/ (state)
│   ├── development-plan-*.md (plan files)
│   └── workflows/ (cached workflows)
└── Fetches from: Workflow Registry (remote, optional)
```

---

### 2. Transport: Dual-Transport Server ⭐

**Recommendation**: Extend the existing server to support both stdio and HTTP transports from the same codebase.

**Rationale**:
- Reuses all existing business logic
- No code duplication
- Users can choose transport via configuration
- Easy migration path
- MCP SDK already supports both transports

**Implementation Approach**:
```typescript
// packages/mcp-server/src/index.ts
const transport = process.env.VIBE_TRANSPORT || 'stdio';

if (transport === 'http') {
  const httpServer = new HttpServerTransport({
    port: process.env.VIBE_HTTP_PORT || 3000,
    host: process.env.VIBE_HTTP_HOST || 'localhost'
  });
  await server.connect(httpServer);
} else {
  // Existing stdio transport
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
}
```

---

### 3. Plan File Management: Client-Side with Server Guidance ⭐

**Recommendation**: Server generates plan file updates as deltas/patches, client applies them to local filesystem.

**Rationale**:
- Plan files remain on user's disk (requirement met)
- Server maintains control over plan structure
- Efficient (only send changes, not full content)
- Secure (no server access to client filesystem)
- Works with any HTTP client

**Protocol**:
```typescript
// Client request includes current plan content (optional, for context)
{
  "tool": "whats_next",
  "args": {
    "context": "...",
    "current_plan_summary": "Current phase: Design, 3/5 tasks complete"
  }
}

// Server response includes plan file delta
{
  "instructions": "Continue with design tasks...",
  "plan_file_operations": {
    "file": ".vibe/development-plan-main.md",
    "operations": [
      {
        "type": "mark_complete",
        "section": "Design",
        "task": "Create database schema"
      },
      {
        "type": "add_task",
        "section": "Implementation",
        "task": "Implement user authentication"
      }
    ]
  }
}
```

**Alternative (Simpler)**:
Include full plan file content in responses if size is manageable.

---

### 4. Workflow Provisioning: Multi-Source with Priority ⭐

**Recommendation**: Support multiple workflow sources with a priority/fallback mechanism.

**Priority Order**:
1. **Project-local workflows** (`.vibe/workflows/`) - Highest priority
2. **Organization workflow registry** (HTTP API) - Custom workflows
3. **NPM packages** (`@company/workflow-*`) - Versioned workflows
4. **Built-in workflows** (`resources/workflows/`) - Default fallback

**Rationale**:
- Flexibility for different use cases
- Gradual migration path
- Organizations can customize
- Developers can override
- Always works (built-in fallback)

**Configuration**:
```yaml
# .vibe/config.yml
workflow_sources:
  - type: local
    path: .vibe/workflows

  - type: registry
    url: https://workflows.company.com/api
    auth:
      type: api_key
      key: ${WORKFLOW_REGISTRY_API_KEY}

  - type: npm
    scope: "@company"

  - type: builtin
```

---

### 5. Workflow Registry: Simple REST API ⭐

**Recommendation**: Build a lightweight workflow registry with REST API for discovery and retrieval.

**Core Endpoints**:
```
GET  /workflows              - List available workflows
GET  /workflows/{name}       - Get specific workflow
GET  /workflows/search?q={q} - Search workflows
POST /workflows              - Publish workflow (admin)
```

**MVP Features**:
- Workflow versioning (semver)
- Domain/complexity filtering
- Simple authentication (API keys)
- Caching support (ETag, Cache-Control)

**Deferred Features** (post-MVP):
- Analytics/usage tracking
- Workflow marketplace
- Community contributions
- Ratings/reviews

---

## Implementation Roadmap

### Phase 1: HTTP Transport (4 weeks)

**Goal**: Basic HTTP support working end-to-end

**Tasks**:
- [ ] Implement Streamable HTTP transport handler
- [ ] Add HTTP server (Express/Fastify)
- [ ] Support JSON-RPC over HTTP
- [ ] Basic SSE streaming support
- [ ] Transport selection mechanism
- [ ] Integration tests

**Success Criteria**:
- Can call `whats_next()` via HTTP POST
- Receives valid JSON response
- Works alongside stdio transport

**Deliverable**: `VIBE_TRANSPORT=http npx responsible-vibe-mcp` works

---

### Phase 2: Plan File Protocol (2 weeks)

**Goal**: Standardized plan file management for HTTP clients

**Tasks**:
- [ ] Design plan file operation format
- [ ] Implement plan delta generation
- [ ] Update tool responses to include plan operations
- [ ] Create client-side helper library
- [ ] Documentation and examples

**Success Criteria**:
- Server generates plan file operations
- Client can apply operations to local files
- Plan files remain in sync

**Deliverable**: Client integration guide and helper library

---

### Phase 3: Workflow Registry (4 weeks)

**Goal**: Central workflow management service

**Tasks**:
- [ ] Design workflow registry API (OpenAPI spec)
- [ ] Implement registry service (Node.js/Express)
- [ ] Database schema (PostgreSQL)
- [ ] Workflow versioning support
- [ ] API authentication
- [ ] Caching layer (Redis)
- [ ] Publishing tools/CLI

**Success Criteria**:
- Can publish workflows to registry
- MCP server fetches workflows from registry
- Workflows cached locally
- Works offline with cache

**Deliverable**: Hosted workflow registry + API

---

### Phase 4: Multi-Source Workflow Loading (2 weeks)

**Goal**: Support multiple workflow sources with fallback

**Tasks**:
- [ ] Enhance WorkflowManager for multiple sources
- [ ] Implement priority/fallback logic
- [ ] Add NPM package scanning
- [ ] Add Git repository support (optional)
- [ ] Configuration file support
- [ ] Cache management

**Success Criteria**:
- Loads workflows from configured sources
- Respects priority order
- Graceful fallback on errors

**Deliverable**: Flexible workflow loading system

---

### Phase 5: Production Hardening (4 weeks)

**Goal**: Production-ready deployment

**Tasks**:
- [ ] Security hardening (input validation, rate limiting)
- [ ] TLS/HTTPS support
- [ ] Health check endpoints
- [ ] Metrics and monitoring (Prometheus)
- [ ] Structured logging
- [ ] Docker images
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline
- [ ] Documentation

**Success Criteria**:
- Passes security audit
- Can be deployed to production
- Monitoring and alerts configured
- Comprehensive documentation

**Deliverable**: Production-ready HTTP MCP server

---

## Total Estimated Timeline

**Aggressive**: 12-14 weeks (3 months)
**Conservative**: 16-20 weeks (4-5 months)
**Recommended**: 16 weeks with 1 week buffer per phase

## Resource Requirements

### Development Team

**Minimum Viable Team**:
- 1 Senior Backend Engineer (HTTP server, API design)
- 1 Full-stack Engineer (workflow registry, client tools)
- 0.5 DevOps Engineer (deployment, infrastructure)
- 0.25 Security Engineer (security review, auth)

**Optimal Team**:
- 2 Senior Backend Engineers
- 1 Full-stack Engineer
- 1 Frontend Engineer (web dashboard, optional)
- 1 DevOps Engineer
- 0.5 Security Engineer

### Infrastructure

**Development**:
- Development workflow registry (single instance)
- PostgreSQL database (development)
- Redis cache (development)

**Production** (if SaaS):
- Load balancer
- 2+ HTTP server instances
- PostgreSQL (managed, HA)
- Redis (managed, HA)
- Monitoring stack (Prometheus + Grafana)

**Estimated Monthly Cost** (AWS/GCP):
- Dev: $50-100/month
- Production (small): $200-500/month
- Production (scaled): $1000-2000/month

---

## Risk Assessment

### High-Confidence Areas ✅

- **Technical feasibility**: Architecture supports HTTP well
- **MCP SDK support**: SDK has Streamable HTTP transport
- **Backward compatibility**: Stdio can coexist with HTTP
- **Local plan files**: Client-side management is proven pattern

### Medium-Risk Areas ⚠️

- **Client adoption**: Clients must implement plan file management
  - *Mitigation*: Provide helper libraries, clear documentation

- **Workflow registry scalability**: Usage patterns unknown
  - *Mitigation*: Start with simple implementation, scale as needed

- **Security**: HTTP opens new attack surface
  - *Mitigation*: Security review, penetration testing, rate limiting

### Low-Risk Areas ℹ️

- **Performance**: HTTP overhead minimal for JSON-RPC
- **Data migration**: File-based storage already compatible
- **Community resistance**: Stdio remains fully supported

---

## Success Metrics

### Technical Metrics

- **Response time**: P95 < 500ms for whats_next()
- **Uptime**: 99.9% for workflow registry
- **Cache hit rate**: > 90% for workflows
- **Error rate**: < 0.1% for HTTP endpoints

### Adoption Metrics

- **Active HTTP users**: Track over time
- **Workflow registry requests**: Monitor usage
- **Custom workflows**: Number of org-specific workflows
- **Client integrations**: Number of clients using HTTP

### Business Metrics

- **Time to workflow update**: < 1 hour (registry) vs weeks (manual)
- **Workflow reuse**: Custom workflows used across teams
- **Support reduction**: Fewer workflow-related issues
- **Enterprise adoption**: Organizations using private registries

---

## Decision Points

### Must Decide Now

1. **Go/No-Go on HTTP**: Approve investigation and start Phase 1?
   - **Recommendation**: ✅ **GO** - High feasibility, clear benefits

2. **Transport strategy**: Dual-transport vs separate servers?
   - **Recommendation**: ✅ **Dual-transport** - Better for users, less maintenance

3. **Plan file approach**: Client-side vs server-side?
   - **Recommendation**: ✅ **Client-side** - Meets requirement, simpler security

### Can Decide Later (During Phase 2-3)

4. **Workflow registry hosting**: Self-hosted vs SaaS?
   - **Recommendation**: Start with reference implementation, decide based on demand

5. **Pricing model**: Open source vs commercial?
   - **Recommendation**: Keep registry open source, consider support/hosting as revenue

6. **Multi-tenancy scope**: Single-user vs enterprise?
   - **Recommendation**: Start single-user, add enterprise features as needed

---

## Next Steps

### Immediate (This Week)

1. **Review this investigation** with stakeholders
2. **Decision meeting**: Go/no-go on HTTP implementation
3. **Technical validation**: Proof of concept
   - Simple HTTP server with one tool call
   - Test MCP SDK Streamable HTTP transport
   - Validate plan file delta approach

### Short Term (Next 2 Weeks)

1. **Create detailed technical spec** for Phase 1
2. **Set up development environment**
3. **Create project tracking** (GitHub issues, milestones)
4. **Begin Phase 1 development**

### Medium Term (Month 2-3)

1. **Complete Phase 1 & 2** (HTTP transport + plan files)
2. **Alpha testing** with selected users
3. **Begin Phase 3** (workflow registry)
4. **Gather feedback** and adjust roadmap

---

## Open Questions for Discussion

1. **Authentication strategy**: API keys, OAuth, or both?
2. **Workflow versioning**: Semver? Date-based? Auto-update?
3. **Registry hosting**: Where should the reference registry live?
4. **Client libraries**: Which languages/frameworks to support first?
5. **Monitoring**: What metrics are most important to track?
6. **Documentation**: Video tutorials? Interactive demos?
7. **Beta program**: Who should be early adopters?

---

## Appendices

### Appendix A: Related Documents

- [Full Investigation Report](./mcp-http-integration-investigation.md)
- [Architecture Diagrams](./mcp-http-architecture-diagram.md)
- [Current Architecture](../docs/dev/ARCHITECTURE.md)
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)

### Appendix B: Proof of Concept Code

**HTTP Transport Skeleton**:
```typescript
// packages/mcp-server/src/transports/http-transport.ts
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export class HttpServerTransport {
  private app: express.Application;
  private server: Server;

  constructor(config: { port: number; host: string }) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupRoutes() {
    // POST endpoint for JSON-RPC
    this.app.post('/mcp', async (req, res) => {
      const jsonRpcRequest = req.body;
      const result = await this.server.handleRequest(jsonRpcRequest);
      res.json(result);
    });

    // GET endpoint for SSE stream (optional)
    this.app.get('/mcp', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      // SSE streaming implementation
    });
  }

  async connect(server: Server) {
    this.server = server;
    return new Promise((resolve) => {
      this.app.listen(this.config.port, this.config.host, resolve);
    });
  }
}
```

### Appendix C: Workflow Registry API Spec (OpenAPI)

```yaml
openapi: 3.0.0
info:
  title: Responsible Vibe Workflow Registry API
  version: 1.0.0

paths:
  /workflows:
    get:
      summary: List available workflows
      parameters:
        - name: domain
          in: query
          schema:
            type: string
            enum: [feature, bugfix, analysis, optimization]
        - name: complexity
          in: query
          schema:
            type: string
            enum: [simple, moderate, complex]
      responses:
        '200':
          description: List of workflows
          content:
            application/json:
              schema:
                type: object
                properties:
                  workflows:
                    type: array
                    items:
                      $ref: '#/components/schemas/WorkflowSummary'

  /workflows/{name}:
    get:
      summary: Get workflow definition
      parameters:
        - name: name
          in: path
          required: true
          schema:
            type: string
        - name: version
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Workflow definition
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkflowDefinition'

components:
  schemas:
    WorkflowSummary:
      type: object
      properties:
        name:
          type: string
        version:
          type: string
        domain:
          type: string
        complexity:
          type: string
        description:
          type: string

    WorkflowDefinition:
      type: object
      properties:
        name:
          type: string
        version:
          type: string
        definition:
          type: object
        checksum:
          type: string
```

---

**Document Owner**: Architecture Team
**Review Status**: Ready for Stakeholder Review
**Last Updated**: 2025-11-30
