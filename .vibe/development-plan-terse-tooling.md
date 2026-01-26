# Development Plan: responsible-vibe (terse-tooling branch)

*Generated on 2026-01-25 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Optimize MCP tool response sizes by removing bloat from tool result interfaces. Target three specific optimizations:
1. Remove `workflow` from `start_development` result
2. Remove `is_modeled_transition` from `proceed_to_phase` result  
3. Remove `conversation_id` from all tool results

Expected outcome: Cleaner, more focused tool responses with reduced payload sizes.

## Explore
<!-- beads-phase-id: TBD -->
### Tasks

*Tasks managed via `bd` CLI*

## Plan
<!-- beads-phase-id: TBD -->
### Tasks

*Tasks managed via `bd` CLI*

## Code
<!-- beads-phase-id: TBD -->
### Tasks

*Tasks managed via `bd` CLI*

## Commit
<!-- beads-phase-id: TBD -->
### Tasks

*Tasks managed via `bd` CLI*

## Key Decisions

1. **Systematic Approach**: Tackle optimizations one by one to avoid conflicts and ensure each change works correctly ✅
2. **Target Fields Identified**: 
   - `workflow` from start_development result (likely large object) ✅ **REMOVED**
   - `is_modeled_transition` from proceed_to_phase result (boolean flag) ✅ **REMOVED**
   - `conversation_id` from all tool results (string identifier) ✅ **REMOVED**
3. **Reset Strategy**: User reset to main branch to start fresh and avoid previous optimization complications ✅
4. **All Changes Successful**: Build completes without errors, all interface changes applied correctly ✅

## Optimization Results

### ✅ **Task 1: Remove workflow from start_development** 
- **Interface**: Removed `workflow: YamlStateMachine` field from `StartDevelopmentResult`
- **Implementation**: Updated all response objects in start-development.ts
- **Impact**: Eliminates large workflow object from every start_development response

### ✅ **Task 2: Remove is_modeled_transition from proceed_to_phase**
- **Interface**: Removed `is_modeled_transition: boolean` from `ProceedToPhaseResult` and `WhatsNextResult`
- **Implementation**: Updated response objects in both proceed-to-phase.ts and whats-next.ts
- **Impact**: Removes unnecessary boolean flag from phase transition responses

### ✅ **Task 3: Remove conversation_id from all tool results**
- **Interfaces**: Removed `conversation_id: string` from:
  - `StartDevelopmentResult`
  - `ProceedToPhaseResult` 
  - `WhatsNextResult`
  - `ResumeWorkflowResult.workflow_status`
  - `GetToolInfoResponse.workflow_states`
- **Implementation**: Updated all response objects across 5 tool handlers
- **Impact**: Eliminates redundant string identifier from all tool responses

## Notes

### **Optimization Success Summary**
✅ **All 3 target optimizations completed successfully:**

1. **`workflow` field removed** from `StartDevelopmentResult` - eliminates large YamlStateMachine object
2. **`is_modeled_transition` field removed** from `ProceedToPhaseResult` and `WhatsNextResult` - removes boolean flag  
3. **`conversation_id` field removed** from all tool result interfaces - eliminates redundant string identifier

### **Files Modified:**
- `src/tool-handlers/start-development.ts` - Interface + 4 response objects updated
- `src/tool-handlers/proceed-to-phase.ts` - Interface + 1 response object updated
- `src/tool-handlers/whats-next.ts` - Interface + 1 response object updated
- `src/tool-handlers/resume-workflow.ts` - Interface + 1 response object updated  
- `src/tool-handlers/get-tool-info.ts` - Interface + 1 response object updated
- `test/e2e/plugin-system-integration.test.ts` - Removed validation for removed fields

### **Build Status**: ✅ **All builds successful** - No TypeScript compilation errors

### **Expected Impact:**
- **Significant payload reduction** for all MCP tool responses
- **Cleaner, more focused** tool result interfaces
- **Maintained functionality** - all core features preserved
- **Systematic approach** prevented conflicts and ensured stability

### **Next Steps for Validation:**
- ✅ **Test actual tool responses** - proceed_to_phase confirmed showing minimal beads instructions
- ✅ **Verify MCP functionality** - all core features work correctly  
- ✅ **Validated beads optimization** - proceed_to_phase uses 2-line minimal instructions vs whats_next verbose guidance
- Document exact percentage reduction achieved

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
