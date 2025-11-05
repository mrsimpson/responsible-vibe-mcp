# Development Plan: responsible-vibe (terse-system-prompt branch)

*Generated on 2025-11-05 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Improve the system prompt instruction propagation by:
1. Reducing redundancy and length in the system prompt
2. Eliminating instructions already covered by tool call results
3. Preventing agents from using their own task management tools
4. Ensuring agents utilize the development plan instead

## Explore
### Tasks
- [x] Analyzed current system prompt structure in system-prompt-generator.ts
- [x] Examined tool response instructions in whats_next and start_development handlers
- [x] Identified redundant instructions between system prompt and tool responses
- [x] Documented current instruction propagation mechanism
- [x] Researched agent task management patterns

### Completed
- [x] Created development plan file

## Plan

### Phase Entrance Criteria:
- [x] Current system prompt structure has been analyzed
- [x] Redundant instructions have been identified
- [x] Tool call result overlaps have been documented
- [x] Agent task management patterns have been researched
- [x] Requirements are clearly defined and scoped

### Tasks
- [x] Design minimal system prompt structure
- [x] Identify instructions to remove from system prompt
- [x] Plan agent task management prevention mechanism
- [x] Define implementation approach for system-prompt-generator.ts
- [x] Plan testing strategy for changes
- [x] Analyze current information flow vs. desired flow
- [x] Identify missing flow components
- [x] Decide on CONVERSATION_NOT_FOUND handling architecture

### Implementation Strategy

**REVISED: Information Flow Design**

**1. System Prompt Role:**
- ONLY: Call whats_next() after every user message (primary directive)
- ONLY: Basic role as development assistant using MCP tools
- Remove all other instructions (tools will provide them)

**2. whats_next() Enhanced Responsibilities:**
- Check if development plan exists, if not → direct to start_development()
- After start_development() → return initial phase instructions
- ALWAYS include: "Follow the development plan, document everything there"
- ALWAYS include: "Call whats_next() after the next user message"
- Explicitly discourage other task management tools

**3. CONVERSATION_NOT_FOUND Handling Architecture Decision:**
- ✅ Return MCP tool error with resolution instructions
- Error message: "No development session found. Call start_development() to begin a new development session."
- Follows MCP conventions: { content: [{ type: 'text', text: 'Error: ...' }], isError: true }
- Much cleaner than fake success response with empty fields

**4. Missing Components Identified:**
- ❌ whats_next() doesn't handle CONVERSATION_NOT_FOUND gracefully
- ❌ whats_next() doesn't include "call whats_next() after next message" instruction
- ❌ No explicit discouragement of other task management tools in responses
- ❌ System prompt doesn't focus solely on whats_next() calling

**5. Current vs. Desired Flow:**
- Current: System prompt provides detailed instructions, tools add more
- Desired: System prompt → whats_next() → all instructions come from tools
- Current: No guarantee of continuous whats_next() calling
- Desired: Every tool response reminds to call whats_next() next time

### Completed
*None yet*

### Completed
*None yet*

## Code

### Phase Entrance Criteria:
- [x] Implementation strategy has been defined
- [x] New system prompt structure has been designed
- [x] Tool response modifications have been planned
- [x] Agent instruction prevention mechanisms have been specified

### Tasks
- [x] Implement minimal system prompt (only whats_next() calling directive)
- [x] Modify whats_next() to return MCP error with start_development() instructions when no conversation
- [x] Add "call whats_next() after next message" to instruction-generator
- [x] Add task management discouragement to whats_next() responses
- [x] Test the complete information flow

### Completed
- [x] Reduced system prompt from ~2000 to ~400 characters
- [x] Removed all redundant instructions (workflow, phase transitions, plan management)
- [x] Added MCP error handling for no conversation case
- [x] Added continuity and task management prevention instructions
- [x] Added critical JSON response handling instruction
- [x] All tests pass (302/302 total, 100% success rate)

### Completed
*None yet*

## Commit

### Phase Entrance Criteria:
- [x] System prompt improvements have been implemented
- [x] Tool responses have been updated to include necessary instructions
- [x] Agent task management prevention is working
- [x] All changes have been tested and validated

### Tasks
- [x] Remove commented-out code from system-prompt-generator.ts
- [x] Verify no temporary debug code remains
- [x] Run final test validation (302/302 tests pass)
- [x] Confirm code is ready for production

### Completed
- [x] Code cleanup completed - removed unused commented code
- [x] Final test validation passed (100% success rate)
- [x] Implementation ready for delivery

## Key Decisions
1. **Current System Prompt Issues Identified:**
   - System prompt is 2000+ characters with repetitive instructions
   - Duplicates instructions already provided by tool responses
   - Contains detailed workflow guidance that tools already provide
   - Includes phase transition logic that's handled by tools

2. **Tool Response Analysis:**
   - whats_next() provides comprehensive phase-specific instructions
   - start_development() includes workflow setup and entrance criteria guidance
   - instruction-generator.ts enhances base instructions with context
   - All necessary guidance is already available through tool responses

3. **Redundancy Areas:**
   - Phase transition instructions (covered by proceed_to_phase tool)
   - Plan file management (covered by whats_next responses)
   - Workflow guidance (provided by start_development and whats_next)
   - Context requirements (handled by instruction generator)

4. **Agent Task Management Prevention:**
   - Need to explicitly instruct agents to avoid their own task management
   - Should redirect to development plan usage instead

5. **Planning Decisions:**
   - Target system prompt reduction from ~2000 to ~400 characters
   - Keep only essential role definition and MCP integration
   - Remove all instructions duplicated by tool responses
   - Add explicit prohibition of agent task management tools
   - Maintain functionality through existing tool response mechanisms

6. **Current Implementation Analysis:**
   - ✅ whats_next() DOES check conversation via ConversationRequiredToolHandler
   - ✅ whats_next() throws CONVERSATION_NOT_FOUND when no development started
   - ❌ System prompt tells agent to "Use start_development() to start" but this conflicts with whats_next() first
   - ❌ No mechanism to handle CONVERSATION_NOT_FOUND and redirect to start_development()
   - ❌ Missing "call whats_next() after next message" in tool responses

7. **WhatsNextResult Interface vs MCP Protocol:**
   - WhatsNextResult is internal TypeScript interface for type safety
   - MCP protocol is schemaless: just { content: [{ type: 'text', text: JSON.stringify(data) }] }
   - We have full flexibility in response structure for no-conversation case
   - Could return minimal response: { phase: 'not-started', instructions: '...' }

8. **Critical Addition:**
   - Added JSON response handling instruction back to system prompt
   - Essential for agents to know how to process tool responses
   - "Each tool call returns a JSON response with an 'instructions' field. Follow these instructions immediately after you receive them."

## Notes
**Current System Prompt Structure:**
- Located in packages/core/src/system-prompt-generator.ts
- Contains ~2000 characters of instructions
- Includes detailed workflow guidance, phase transitions, plan file management
- Much of this content is redundantly provided by tool responses

**Tool Response Instruction Mechanism:**
- whats_next() generates phase-specific instructions via instruction-generator.ts
- start_development() provides initial workflow setup guidance
- All tools return JSON with "instructions" field that agents follow
- Instructions are dynamically generated based on current context

**Identified Redundancies:**
- System prompt explains whats_next() usage - but tool responses guide this
- System prompt details phase transitions - but proceed_to_phase handles this
- System prompt explains plan file management - but whats_next() provides this guidance
- System prompt includes conversation context guidelines - but tools handle this

**Agent Task Management Patterns:**
- Some agents (like Claude) have built-in task management capabilities
- These can conflict with the development plan approach
- Need explicit instruction to use development plan instead of agent's own tools

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
