# Development Plan: responsible-vibe (fix-workflow-ressources branch)

*Generated on 2025-10-14 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix regression where loading workflow resources via MCP fails with error "Workflow 'minor' not found in resources/workflows/"

## Reproduce
### Tasks
- [x] Investigate error message and stack trace
- [x] Check if workflow files exist in resources/workflows/
- [x] Identify file extension mismatch (.yml vs .yaml)
- [x] Reproduce the bug: code looks for .yml but files are .yaml

### Completed
- [x] Created development plan file
- [x] Bug successfully reproduced

## Analyze

### Phase Entrance Criteria:
- [x] Bug has been successfully reproduced
- [x] Error conditions and stack trace are documented
- [x] Environment and system state are understood

### Tasks
- [x] Examine path resolution logic in workflow-resource.ts
- [x] Create debug script to test path resolution
- [x] Identify incorrect path calculation for non-dist case
- [x] Confirm source file location: packages/mcp-server/src/resource-handlers/

### Completed
- [x] Root cause identified: Incorrect path resolution in non-dist case

## Fix

### Phase Entrance Criteria:
- [x] Root cause has been identified
- [x] Fix approach has been determined
- [x] Impact assessment is complete

### Tasks
- [x] Update path resolution in workflow-resource.ts (change ../../../ to ../../../../ for non-dist case)
- [x] Rebuild project to update compiled JavaScript
- [x] Clean up debug files

### Completed
- [x] Fix implemented and compiled

## Verify

### Phase Entrance Criteria:
- [x] Fix has been implemented
- [x] Code changes are complete
- [x] Fix addresses the root cause

### Tasks
- [x] Test fix with debug script for dist case
- [x] Verify both dist and source cases work correctly
- [x] Confirm workflow files are found correctly
- [x] Clean up debug files

### Completed
- [x] Fix verified to work correctly for both dist and source cases

### Completed
*None yet*

## Finalize

### Phase Entrance Criteria:
- [ ] Fix has been verified to work
- [ ] No regressions have been introduced
- [ ] All tests pass

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
- **Root Cause Identified**: Incorrect path resolution in workflow-resource.ts for both dist and source cases
- **Location**: `/packages/mcp-server/src/resource-handlers/workflow-resource.ts` line ~62-68
- **Issue**: Both dist and source cases went up 3 levels instead of 4 levels to reach project root
- **Source path**: `packages/mcp-server/src/resource-handlers/workflow-resource.ts` (4 levels to root)
- **Dist path**: `packages/mcp-server/dist/resource-handlers/workflow-resource.js` (4 levels to root)
- **Fix approach**: Change both cases to use `../../../../` to go up 4 levels

## Notes
- Error occurs when MCP tries to load workflow://minor resource
- All workflow files in resources/workflows/ use .yaml extension
- Code in workflow-resource.js looks for .yml extension
- This is a simple file extension mismatch causing the "not found" error

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
