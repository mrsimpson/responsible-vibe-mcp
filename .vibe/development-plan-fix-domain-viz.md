# Development Plan: responsible-vibe (fix-domain-viz branch)

*Generated on 2025-10-03 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix bug where bundled workflows created during build for the visualizer/interactive docs are missing domain information

## Reproduce
### Tasks
- [x] Examine build scripts for bundled workflows
- [x] Check workflow source files for domain metadata
- [x] Examine how WorkflowLoader uses bundled workflows
- [x] Identify the root cause

### Completed
- [x] Created development plan file
- [x] Bug successfully reproduced and understood

## Analyze

### Phase Entrance Criteria:
- [x] Bug has been successfully reproduced
- [x] Exact steps to reproduce are documented
- [x] Build process for bundled workflows is understood

### Tasks
- [x] Analyze current build script implementation
- [x] Examine WorkflowLoader.getAvailableWorkflows() inefficiency
- [x] Identify why domain parsing happens at runtime instead of build time
- [x] Determine optimal solution approach
- [x] Re-analyze documentation system issue - found the real root cause
- [x] Identify where exactly domains should appear in documentation
- [x] Trace the data flow from bundled workflows to documentation display
- [x] Determine if issue is in data extraction or display logic
- [x] Discovered Vue component needs same fix as commit 7274c669053c8696dbb001103374dadf6c575fef

### Completed
- [x] Root cause analysis complete for visualizer
- [x] Root cause analysis for documentation system complete

## Fix

### Phase Entrance Criteria:
- [x] Root cause of missing domain information has been identified
- [x] Fix approach has been determined and documented

### Tasks
- [x] Modify build-workflows.js to parse YAML and extract metadata
- [x] Modify build-dev-workflows.js to parse YAML and extract metadata
- [x] Update BundledWorkflows interface to include metadata
- [x] Update WorkflowLoader to use pre-parsed metadata

### Completed
- [x] All build script modifications complete

## Verify

### Phase Entrance Criteria:
- [x] Fix has been implemented
- [x] Code changes are complete

### Tasks
- [x] Verify both build scripts run without errors
- [x] Confirm metadata is included in generated files
- [x] Check that domain information is present for all workflows
- [x] Test that WorkflowLoader can access pre-parsed metadata
- [x] Verify no regressions in existing functionality

### Completed
- [x] All verification tests passed

## Finalize

### Phase Entrance Criteria:
- [x] Fix has been verified to work correctly
- [x] No regressions have been introduced
- [x] Bundled workflows now include domain information

### Tasks
- [x] Code cleanup - removed temporary debug console logs
- [x] Review TODO/FIXME comments - none were added
- [x] Remove debugging code blocks - none were added
- [x] Documentation system fix - updated [workflow].paths.js to extract domain metadata
- [x] Final validation - all tests pass
- [x] Bug fix ready for production

### Completed
- [x] All finalization steps complete

## Key Decisions
- **Root Cause Identified**: The build scripts (`build-workflows.js` and `build-dev-workflows.js`) only bundle raw YAML content as strings, but don't parse the YAML to extract metadata including domain information
- **Current Behavior**: WorkflowLoader.getAvailableWorkflows() tries to parse each bundled workflow to extract domain, but this is inefficient and error-prone
- **Issue Location**: Build scripts need to parse YAML and include parsed metadata in the bundled output
- **Solution Approach**: Modify build scripts to parse YAML using js-yaml (already available as dependency) and bundle both raw YAML and parsed metadata
- **Performance Impact**: Moving parsing from runtime to build time will improve visualizer performance
- **Documentation System Root Cause**: The Vue component in `/docs/.vitepress/components/WorkflowVisualizer.vue` was missing the domain display logic that was added to the standalone visualizer in commit 7274c669053c8696dbb001103374dadf6c575fef
- **Redundant Code Issue**: The Vue component duplicates the dropdown logic from main.ts but was not updated with the same domain display fix

## Notes
*Additional context and observations*

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
