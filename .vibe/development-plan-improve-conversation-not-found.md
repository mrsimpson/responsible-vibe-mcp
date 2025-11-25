# Development Plan: responsible-vibe (improve-conversation-not-found branch)

*Generated on 2025-11-19 by Vibe Feature MCP*
*Workflow: [minor](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/minor)*

## Goal
When a tool throws CONVERSATION_NOT_FOUND error, enhance the MCP tool handler to return a more helpful exception message that explains the user should call start_development.

## Explore

### Phase Entrance Criteria:
- [x] Development plan created and initialized

### Tasks

### Completed
- [x] Complete exploration analysis and got user approval
- [x] User requested: don't propose concrete workflows in error messages
- [x] Created development plan file
- [x] Located CONVERSATION_NOT_FOUND error sources (base-tool-handler.ts, whats-next.ts)
- [x] Located error handling in createToolHandler function (server-config.ts)
- [x] Understood current error flow
- [x] Found existing helper function createConversationNotFoundResult in server-helpers.ts
- [x] Identified that the helper function exists but is not being used

## Implement

### Phase Entrance Criteria:
- [x] Current error flow is fully understood
- [x] Design for improved error message is documented
- [x] User has approved approach

### Tasks

### Completed
- [x] Modified createConversationNotFoundResult to not suggest specific workflows
- [x] Modified BaseToolHandler to catch CONVERSATION_NOT_FOUND and use the helper
- [x] Test the changes manually (verified error handling logic)
- [x] Run existing tests to ensure nothing breaks (all tests passed)
*None yet*

## Finalize

### Phase Entrance Criteria:
- [x] Code changes are implemented and working
- [x] Error message is clear and helpful
- [x] Changes have been tested

### Tasks

### Completed
- [x] Search for any debug output or console.log statements (none found)
- [x] Check for TODO/FIXME comments (none found)
- [x] Verify no temporary debugging code remains (clean)
- [x] Final test run (15 test files, 118 tests passed)
- [x] Add test for CONVERSATION_NOT_FOUND error handling (5 new tests added)
- [x] Verify all tests pass (16 test files, 123 tests passed)

## Key Decisions

### Decision 1: Use Existing Helper Function
**Context:** There's already a `createConversationNotFoundResult` function in `server-helpers.ts` that generates helpful error messages with suggestions to call `start_development`.

**Decision:** Instead of creating a new error handling approach, we should utilize the existing `createConversationNotFoundResult` helper function. However, we need to modify it to NOT suggest specific workflows (per user request).

**Rationale:**
- The helper function already exists and provides exactly what we need
- It includes helpful metadata like suggestions and available workflows
- It's currently not being used anywhere in the codebase
- Using existing functions promotes code reuse and consistency

### Decision 2: Modify Base Tool Handler
**Context:** The `CONVERSATION_NOT_FOUND` error is currently thrown as a simple string error in `base-tool-handler.ts`.

**Decision:** Modify the base tool handler to catch `CONVERSATION_NOT_FOUND` errors and convert them to helpful error results using the `createConversationNotFoundResult` helper.

**Implementation Approach:**
1. Modify `base-tool-handler.ts` in the `handle()` method
2. Catch errors with message "CONVERSATION_NOT_FOUND"
3. Call `createConversationNotFoundResult(workflowNames)` to generate a helpful error
4. Return the helpful error result instead of the generic one

**Benefits:**
- Centralized error handling - all tools automatically get the improved message
- Consistent user experience across all tools that require a conversation
- Minimal code changes required

## Notes

### Implementation Summary
Successfully implemented improved error handling for CONVERSATION_NOT_FOUND errors:

1. **Modified `server-helpers.ts`**: Updated `createConversationNotFoundResult()` to provide helpful error messages without suggesting specific workflows (as per user request).

2. **Modified `base-tool-handler.ts`**: Enhanced the `handle()` method to catch CONVERSATION_NOT_FOUND errors and convert them into user-friendly error messages using the helper function.

3. **Added comprehensive tests**: Created new test file `conversation-not-found-error.test.ts` with 5 tests covering:
   - Error handling for `whats_next` tool
   - Error handling for `proceed_to_phase` tool
   - Error handling for `resume_workflow` tool
   - Verification that error messages don't suggest specific workflows
   - Validation of helpful guidance content

4. **Benefits**:
   - All tools that require a conversation now automatically provide helpful error messages
   - Consistent user experience across the entire MCP server
   - Centralized error handling reduces code duplication
   - Users get clear guidance to call `start_development` when needed
   - No specific workflow suggestions (as requested by user)

5. **Testing**: All 123 tests in 16 test files pass successfully.

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
