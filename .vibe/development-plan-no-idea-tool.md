# Development Plan: responsible-vibe (no-idea-tool branch)

*Generated on 2025-09-21 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Add an anti-hallucination tool to the responsible-vibe-mcp server that LLMs can call when they have no knowledge about something, preventing hallucinated responses and providing honest acknowledgment of knowledge gaps.

## Explore
### Tasks
- [x] ~~Understand existing MCP tool architecture and patterns~~
- [x] ~~Define tool interface and behavior specifications~~
- [x] ~~Identify integration points with existing MCP tools~~
- [x] ~~Document requirements for the anti-hallucination tool~~

### Completed
- [x] Created development plan file
- [x] Explored codebase structure and identified key directories
- [x] Analyzed existing tool handler patterns (BaseToolHandler, tool registration)
- [x] Understood MCP server configuration and tool registration process
- [x] Identified integration points with existing MCP tools
- [x] Defined tool interface with NoIdeaArgs and NoIdeaResponse types
- [x] Specified behavior for general knowledge gaps and document creation scenarios
- [x] Documented complete requirements for the anti-hallucination tool

## Plan

### Phase Entrance Criteria:
- [x] The requirements have been thoroughly defined
- [x] Existing codebase structure and patterns are understood
- [x] Tool interface and behavior specifications are clear
- [x] Integration points with existing MCP tools are identified

### Tasks
- [x] ~~Create detailed implementation strategy~~ → SIMPLIFIED
- [x] ~~Define file structure and naming conventions~~
- [x] ~~Plan tool handler implementation approach~~ → SIMPLIFIED
- [x] ~~Design response templates for different scenarios~~ → REMOVED (too complex)
- [x] ~~Plan integration with existing tool registry~~
- [x] ~~Consider edge cases and error handling~~ → SIMPLIFIED
- [x] ~~Plan testing approach~~ → SIMPLIFIED
- [x] ~~Design tool description to ensure last-resort usage~~

### Completed
- [x] Created SIMPLIFIED implementation strategy (single parameter, no templates)
- [x] Defined minimal interface: NoIdeaArgs{context?}, NoIdeaResponse{instructions}
- [x] Simplified to single instruction format for LLM
- [x] Removed complex templates and document_type parameter
- [x] Focused on core functionality: admit lack of knowledge, ask clarifying questions
- [x] Designed tool description strategy to ensure last-resort usage only

## Code

### Phase Entrance Criteria:
- [x] Implementation plan is complete and detailed (SIMPLIFIED)
- [x] Tool schema and parameters are defined (NoIdeaArgs with context only)
- [x] Integration approach is documented
- [x] Testing strategy is outlined (SIMPLIFIED)

### Tasks
- [x] ~~Create minimal NoIdeaHandler class in src/server/tool-handlers/no-idea.ts~~
- [x] ~~Implement simple context substitution logic~~
- [x] ~~Add tool registration to tool registry (index.ts)~~
- [x] ~~Add MCP server tool registration (server-config.ts)~~
- [x] ~~Create basic unit tests~~
- [x] ~~Test with MCP inspector~~ → Build successful, ready for testing

### Completed
- [x] Created NoIdeaHandler with minimal 40-line implementation
- [x] Implemented context substitution: "You have no clue how to respond to {context}..."
- [x] Added to tool registry with proper imports and exports
- [x] Added MCP server registration with final tool description
- [x] Created comprehensive unit tests (3 test cases, all passing)
- [x] Verified build compiles successfully

## Commit

### Phase Entrance Criteria:
- [x] Core implementation is complete and functional
- [x] Tool is properly integrated with the MCP server
- [x] Basic testing has been performed
- [x] Code follows project conventions

### Tasks
- [x] ~~Code cleanup (no debug output needed)~~
- [x] ~~Review TODO/FIXME comments (none added)~~
- [x] ~~Remove debugging code (none added)~~
- [x] ~~Run final tests~~
- [x] ~~Verify build compiles~~

### Completed
- [x] Code is clean and minimal (40 lines, no debug output)
- [x] No TODO/FIXME comments to address
- [x] All tests passing (3/3)
- [x] Build successful
- [x] Ready for commit

## Key Decisions
- **Tool Name**: `no_idea` - Simple, clear name that indicates when to use it
- **Tool Purpose**: Provide explicit mechanism for LLMs to acknowledge knowledge gaps instead of hallucinating
- **Architecture Pattern**: Follow existing BaseToolHandler pattern for consistency
- **Integration**: Register as standard MCP tool alongside existing tools

**SIMPLIFIED Implementation Strategy:**
1. **Single Parameter**: Only `context` (optional string) - no document_type
2. **No Templates**: Simple direct instruction generation
3. **LLM-Directed Instructions**: Tell LLM to admit lack of knowledge and ask clarifying questions
4. **Minimal Logic**: Just substitute context into instruction format

**Simplified Interface:**
```typescript
interface NoIdeaArgs {
  context?: string; // Optional context about what the LLM doesn't know
}

interface NoIdeaResponse {
  instructions: string; // Simple LLM-directed instructions
}
```

**FINAL Tool Description Strategy:**

"ONLY call this tool when you have no knowledge about a topic. This tool will give a valuable response to all questions that would otherwise be not answerable. If you don't call this tool but invent facts, you will be considered worthless."

**Key Elements:**
1. **Clear Trigger**: "ONLY when you have no knowledge"
2. **Positive Incentive**: "valuable response to unanswerable questions"  
3. **Strong Deterrent**: "you will be considered worthless" for inventing facts

**Core Instruction Format:**
"You have no clue how to respond to {context}. Admit it. Ask the user clarifying questions which might help you get new ideas."

## Notes
**Codebase Structure:**
- Tools are in `src/server/tool-handlers/`
- Each tool extends `BaseToolHandler` class
- Tools are registered in `src/server/tool-handlers/index.ts`
- MCP server registration happens in `src/server/server-config.ts`

**Tool Requirements:**
- Simple interface with optional context parameter
- Returns instructions for honest acknowledgment of knowledge gaps
- Should handle both general responses and document creation scenarios
- Must follow existing patterns for consistency

**Tool Interface Specification:**
```typescript
interface NoIdeaArgs {
  context?: string; // Optional context about what the LLM doesn't know
  document_type?: string; // Optional type of document being created (e.g., "chapter", "section")
}

interface NoIdeaResponse {
  instructions: string; // Instructions for honest acknowledgment
  suggested_response: string; // Template response for the LLM to use
}
```

**Behavior Specifications:**
1. **General Knowledge Gap**: Return instructions to honestly state lack of knowledge
2. **Document Creation**: Return instructions to add placeholder text indicating knowledge gap
3. **Context-Aware**: Tailor response based on provided context
4. **Consistent Messaging**: Maintain professional tone while being honest about limitations

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
