# Development Plan: responsible-vibe (fix-workflow-visualizer branch)

*Generated on 2025-09-04 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix workflow file upload functionality in deployed documentation - works locally but fails in production with "onWorkflowLoaded not implemented" error

## Reproduce
### Tasks
- [x] Examine the error message and understand the issue
- [x] Compare local vs deployed environments
- [x] Investigate workflow visualizer code structure
- [x] Identify the root cause

### Completed
- [x] Created development plan file
- [x] **ROOT CAUSE IDENTIFIED**: The Vue component in `/docs/.vitepress/components/WorkflowVisualizer.vue` creates a `FileUploadHandler` but never sets up the callback handlers (`onWorkflowLoaded` and `onUploadError`). The standalone version in `workflow-visualizer/src/main.ts` correctly sets these callbacks, but the documentation version doesn't.

## Analyze

### Phase Entrance Criteria:
- [x] Bug has been successfully reproduced
- [x] Exact steps to reproduce are documented
- [x] Error messages and logs are captured
- [x] Environment differences between local and deployed are identified

### Tasks
- [x] Examine the working implementation in main.ts
- [x] Identify the missing callback setup in Vue component
- [x] Analyze the required callback functions
- [x] Determine the minimal fix approach

### Completed
- [x] **Analysis Complete**: The Vue component needs to set up two callback handlers after creating the FileUploadHandler:
  - `onWorkflowLoaded`: Should update app state, render workflow, and update side panel
  - `onUploadError`: Should handle errors using the error handler
- [x] **Code Path Analysis**: The working main.ts sets these callbacks in setupEventListeners() method around lines 120-122
- [x] **Required Functions**: Need to implement equivalent of handleWorkflowLoaded() and handleUploadError() methods in Vue component

## Fix

### Phase Entrance Criteria:
- [x] Root cause has been identified
- [x] Fix approach has been determined
- [x] Impact assessment is complete

### Tasks
- [x] Add onWorkflowLoaded callback to Vue component
- [x] Add onUploadError callback to Vue component
- [x] Ensure callbacks mirror the functionality from main.ts

### Completed
- [x] **Fix Implemented**: Added missing callback setup to WorkflowVisualizer.vue after FileUploadHandler creation
- [x] **onWorkflowLoaded**: Updates appState, renders workflow, calls updateSidePanel()
- [x] **onUploadError**: Logs error and shows using errorHandler
- [x] **Code Location**: Added callbacks around line 460 in `/docs/.vitepress/components/WorkflowVisualizer.vue`

## Verify

### Phase Entrance Criteria:
- [x] Fix has been implemented
- [x] Code changes are complete
- [x] Fix addresses the root cause

### Tasks
- [x] Build documentation with fix
- [x] Serve documentation locally
- [x] Test workflow file upload functionality
- [x] Verify no "onWorkflowLoaded not implemented" error
- [x] Run existing tests to check for regressions

### Completed
- [x] **Fix Verified**: User confirmed workflow upload works in local build
- [x] **Original Bug Resolved**: No more "FileUploadHandler: onWorkflowLoaded not implemented" error
- [x] **Build Success**: Documentation builds without errors
- [x] **Functionality Restored**: Custom workflow file upload now works in documentation
- [x] **No Regressions**: All 245 tests pass, confirming no side effects from the fix

## Finalize

### Phase Entrance Criteria:
- [x] Fix has been verified to work
- [x] No regressions have been introduced
- [x] All tests pass

### Tasks
- [x] Review code for debug statements and temporary code
- [x] Check for TODO/FIXME comments
- [x] Verify no commented-out or experimental code
- [x] Confirm error handling is appropriate
- [x] Validate documentation accuracy
- [x] Final test run confirmation
- [x] Commit the bug fix with conventional commit message

### Completed
- [x] **Code Cleanup Complete**: No debug statements or temporary code found that needs removal
- [x] **Error Handling Verified**: Console.error statements are appropriate and match original implementation
- [x] **No TODOs/FIXMEs**: No outstanding TODO or FIXME comments found
- [x] **Documentation Accurate**: No documentation changes needed - fix restores existing functionality
- [x] **Final Validation**: All 245 tests pass, fix is production-ready
- [x] **Committed**: Bug fix committed with conventional commit message (c34bfd5)

## Key Decisions
- **Environment Difference**: Local development uses `workflow-visualizer/src/main.ts` which properly sets up FileUploadHandler callbacks, while deployed documentation uses Vue component that doesn't set up these callbacks
- **Fix Strategy**: Add the missing callback setup to the Vue component, mirroring the implementation in main.ts
- **Minimal Fix Approach**: Add callback setup immediately after FileUploadHandler creation in Vue component (around line 460)
- **Required Callbacks**: 
  - `onWorkflowLoaded`: Update appState, render workflow with plantUMLRenderer, call updateSidePanel()
  - `onUploadError`: Log error and show using errorHandler

## Notes
*Additional context and observations*

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
