# MCP over HTTP - Architecture Diagrams

## Recommended Hybrid Architecture

```mermaid
graph TB
    subgraph "Central Services (Optional Cloud)"
        WR[Workflow Registry API]
        WD[(Workflow Database)]
        AN[Analytics Service]

        WR --> WD
        WR --> AN
    end

    subgraph "User's Machine"
        subgraph "MCP Server (Dual Transport)"
            HTTP[HTTP Transport<br/>Streamable HTTP + SSE]
            STDIO[Stdio Transport<br/>stdin/stdout]

            subgraph "Server Core"
                SM[Server Manager]
                CM[Conversation Manager]
                WM[Workflow Manager]
                PM[Plan Manager]
                TM[Transition Engine]
            end

            HTTP --> SM
            STDIO --> SM
            SM --> CM
            SM --> WM
            SM --> PM
            CM --> TM
            WM -.fetch workflows.-> WR
        end

        subgraph "Local Storage"
            FS[.vibe/<br/>conversations/<br/>state.json]
            PF[.vibe/<br/>development-plan-*.md]
            LW[.vibe/<br/>workflows/]

            CM --> FS
            PM --> PF
            WM --> LW
        end

        subgraph "Clients"
            LA[Local Agent<br/>Claude Desktop/etc]
            WB[Web Browser<br/>Future web client]

            LA -.stdio.-> STDIO
            WB -.HTTP.-> HTTP
        end
    end

    subgraph "Remote Clients (Optional)"
        RC[Remote Agent<br/>Cloud IDE/etc]
        RC -.HTTP.-> HTTP
    end

    style WR fill:#e1f5ff
    style PF fill:#ffe1e1
    style FS fill:#ffe1e1
    style LW fill:#ffe1e1
    style SM fill:#d4edda
    style HTTP fill:#fff3cd
    style STDIO fill:#fff3cd
```

## Data Flow: Local Plan Files with Remote Workflows

```mermaid
sequenceDiagram
    participant C as Client (Local Agent)
    participant H as MCP HTTP Server<br/>(Local)
    participant FS as File System<br/>(.vibe/)
    participant WR as Workflow Registry<br/>(Remote)

    Note over C,WR: 1. Initialization
    C->>H: start_development(workflow="epcc")
    H->>WR: GET /workflows/epcc
    WR-->>H: Workflow Definition (YAML)
    H->>FS: Cache workflow locally
    H->>FS: Create .vibe/conversations/{id}/state.json
    H->>FS: Initialize development-plan-main.md
    H-->>C: Instructions + plan_file_path

    Note over C,WR: 2. Development Iteration
    C->>FS: Read development-plan-main.md
    C->>H: whats_next(current_plan_content="...")
    H->>H: Generate phase instructions
    H->>H: Generate plan updates
    H-->>C: Instructions + updated_plan_delta
    C->>FS: Apply plan delta to local file

    Note over C,WR: 3. Phase Transition
    C->>H: proceed_to_phase(target="implementation")
    H->>FS: Update conversation state
    H->>H: Generate new phase instructions
    H-->>C: New instructions + plan template
    C->>FS: Update local plan file

    Note over C,WR: 4. Offline Operation
    C->>H: whats_next() (no network)
    H->>FS: Use cached workflow
    H-->>C: Instructions (from cache)
    Note over C,H: Works offline with cached workflows!
```

## Workflow Provisioning - Multi-Source Strategy

```mermaid
graph TB
    subgraph "MCP Server - Workflow Resolution"
        WM[Workflow Manager]

        subgraph "Priority 1: Project Local"
            L1[.vibe/workflows/]
        end

        subgraph "Priority 2: Organization Registry"
            L2[HTTP Workflow Registry<br/>company.com/workflows]
        end

        subgraph "Priority 3: NPM Packages"
            L3[@company/workflow-*<br/>node_modules/]
        end

        subgraph "Priority 4: Built-in"
            L4[resources/workflows/<br/>Built-in YAML files]
        end

        WM -->|1. Check| L1
        WM -->|2. Check if not found| L2
        WM -->|3. Check if not found| L3
        WM -->|4. Fallback| L4
    end

    L1 -->|Found| WF[Workflow Definition]
    L2 -->|Found| WF
    L3 -->|Found| WF
    L4 -->|Always available| WF

    style WF fill:#d4edda
    style L1 fill:#ffe1e1
    style L2 fill:#e1f5ff
    style L3 fill:#fff3cd
    style L4 fill:#f8f9fa
```

## Plan File Management - HTTP Mode

```mermaid
graph LR
    subgraph "Client Responsibilities"
        CR[Read/Write<br/>Local Plan Files]
        CP[Maintain<br/>Plan State]
    end

    subgraph "Server Responsibilities"
        SG[Generate<br/>Plan Updates]
        SD[Calculate<br/>Deltas]
        SI[Phase-specific<br/>Instructions]
    end

    subgraph "Local Disk"
        PF[.vibe/<br/>development-plan-*.md]
    end

    Client[HTTP Client] --> CR
    CR <--> PF
    CR -->|current_plan_content| Server[MCP HTTP Server]
    Server --> SG
    SG --> SD
    SD -->|plan_delta| Client
    Server --> SI
    SI -->|instructions| Client
    Client --> CP

    style PF fill:#ffe1e1
    style Client fill:#e1f5ff
    style Server fill:#d4edda
```

## Deployment Options Comparison

```mermaid
graph TB
    subgraph "Option 1: Local Only (Current + HTTP)"
        L1[MCP Server<br/>Local Process]
        L1S[Local Storage<br/>.vibe/]
        L1W[Local Workflows<br/>resources/]

        L1 --> L1S
        L1 --> L1W
    end

    subgraph "Option 2: Hybrid (Recommended)"
        H1[MCP Server<br/>Local Process]
        H1S[Local Storage<br/>.vibe/]
        H1W[Workflow Cache<br/>.vibe/workflows/]
        H1R[Remote Registry<br/>HTTP API]

        H1 --> H1S
        H1 --> H1W
        H1 -.fetch.-> H1R
    end

    subgraph "Option 3: Fully Remote (Future)"
        R1[MCP Server<br/>Cloud Service]
        R1S[Cloud Storage<br/>Database]
        R1W[Workflow Registry<br/>HTTP API]
        R1L[Local Agent<br/>Plan File Sync]

        R1 --> R1S
        R1 --> R1W
        R1 <-.HTTP.-> R1L
        R1L --> R1LP[Local Plan Files]
    end

    style L1 fill:#f8f9fa
    style H1 fill:#d4edda
    style R1 fill:#e1f5ff
    style H1R fill:#fff3cd
    style R1LP fill:#ffe1e1
```

## Session Management - Multi-Tenancy

```mermaid
graph TB
    subgraph "HTTP MCP Server"
        LB[Load Balancer /<br/>Request Router]

        subgraph "Session Isolation"
            S1[Session: user1/project-a/main]
            S2[Session: user1/project-b/feature]
            S3[Session: user2/project-c/main]

            S1 --> ST1[State:<br/>conversations/user1-project-a-main/]
            S2 --> ST2[State:<br/>conversations/user1-project-b-feature/]
            S3 --> ST3[State:<br/>conversations/user2-project-c-main/]
        end

        LB -->|Route by<br/>userId + projectId + branch| S1
        LB -->|Route by<br/>userId + projectId + branch| S2
        LB -->|Route by<br/>userId + projectId + branch| S3
    end

    C1[Client 1<br/>user1, project-a] -.Authorization: Bearer token1<br/>X-Project-ID: project-a<br/>X-Git-Branch: main.-> LB
    C2[Client 2<br/>user1, project-b] -.Authorization: Bearer token1<br/>X-Project-ID: project-b<br/>X-Git-Branch: feature.-> LB
    C3[Client 3<br/>user2, project-c] -.Authorization: Bearer token2<br/>X-Project-ID: project-c<br/>X-Git-Branch: main.-> LB

    style S1 fill:#e1f5ff
    style S2 fill:#ffe1e1
    style S3 fill:#d4edda
    style LB fill:#fff3cd
```

## HTTP Transport Implementation

```mermaid
sequenceDiagram
    participant C as HTTP Client
    participant S as HTTP Server<br/>(Express/Fastify)
    participant M as MCP Server Core
    participant T as Tool Handlers

    Note over C,T: JSON-RPC over Streamable HTTP

    C->>S: POST /mcp<br/>Content-Type: application/json<br/>Accept: application/json, text/event-stream

    S->>S: Parse JSON-RPC request
    S->>S: Authenticate & authorize
    S->>S: Extract session info

    S->>M: Route to MCP handler
    M->>T: Call tool handler (whats_next)

    alt Quick Response
        T-->>M: Response < 1s
        M-->>S: JSON response
        S-->>C: HTTP 200<br/>Content-Type: application/json<br/>{result}
    else Long-Running Operation
        T-->>M: Streaming response
        M-->>S: SSE stream
        S-->>C: HTTP 200<br/>Content-Type: text/event-stream<br/>data: {partial_result}
        S-->>C: data: {partial_result}
        S-->>C: data: {final_result}
    end
```

## Workflow Registry API

```mermaid
graph TB
    subgraph "Workflow Registry Service"
        API[REST API]

        subgraph "Endpoints"
            E1[GET /workflows]
            E2[GET /workflows/:name]
            E3[POST /workflows<br/>Admin only]
            E4[PUT /workflows/:name<br/>Admin only]
            E5[GET /workflows/search]
        end

        API --> E1
        API --> E2
        API --> E3
        API --> E4
        API --> E5

        DB[(Workflow Storage<br/>PostgreSQL/MongoDB)]
        CACHE[Redis Cache]

        E1 --> CACHE
        E2 --> CACHE
        CACHE --> DB
        E3 --> DB
        E4 --> DB
        E5 --> DB
    end

    subgraph "Workflow Sources"
        GIT[Git Repositories]
        NPM[NPM Packages]
        UI[Admin UI]
    end

    GIT -.sync.-> E3
    NPM -.sync.-> E3
    UI -.upload.-> E3

    subgraph "Clients"
        MCP[MCP Servers]
        CLI[CLI Tools]
        WEB[Web Dashboard]
    end

    MCP -.fetch.-> E1
    MCP -.fetch.-> E2
    CLI -.fetch.-> E5
    WEB -.browse.-> E1

    style API fill:#d4edda
    style DB fill:#e1f5ff
    style CACHE fill:#fff3cd
```

## Security Layers

```mermaid
graph TB
    subgraph "Security Architecture"
        subgraph "Layer 1: Network"
            TLS[TLS/HTTPS<br/>Encryption in Transit]
            CORS[CORS Policy]
            RL[Rate Limiting]
        end

        subgraph "Layer 2: Authentication"
            AUTH[Authentication<br/>JWT/API Keys]
            MFA[MFA<br/>Enterprise]
        end

        subgraph "Layer 3: Authorization"
            RBAC[RBAC<br/>Role-Based Access]
            PEP[Policy Enforcement<br/>Project/Workflow Access]
        end

        subgraph "Layer 4: Data"
            ENC[Encryption at Rest]
            ISO[Tenant Isolation]
            AUD[Audit Logging]
        end

        subgraph "Layer 5: Application"
            VAL[Input Validation]
            SAN[Path Sanitization]
            XSS[XSS Protection]
        end
    end

    CLIENT[HTTP Client] --> TLS
    TLS --> CORS
    CORS --> RL
    RL --> AUTH
    AUTH --> MFA
    MFA --> RBAC
    RBAC --> PEP
    PEP --> VAL
    VAL --> SAN
    SAN --> XSS
    XSS --> APP[Application Logic]
    APP --> ENC
    APP --> ISO
    APP --> AUD

    style TLS fill:#d4edda
    style AUTH fill:#fff3cd
    style RBAC fill:#e1f5ff
    style ENC fill:#ffe1e1
```

---

**Legend:**
- 🟢 Green: Recommended/Primary components
- 🔵 Blue: Remote/Cloud components
- 🔴 Red: Local storage (user's disk)
- 🟡 Yellow: Transport/Communication layers
- ⚪ Gray: Optional/Fallback components
