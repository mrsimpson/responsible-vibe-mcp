# Development Plan: responsible-vibe (fix-visualize-all-workflows branch)

*Generated on 2025-11-26 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix bug where not all workflows can be visualized (404 error for http://localhost:5174/responsible-vibe-mcp/workflows/slides). The issue appears to be that bundled workflows are hard-coded in packages/visualizer/src/services/BundledWorkflows.ts

## Reproduce
### Tasks
- [x] Confirmed the issue: VitePress shows 404 on page for workflows not in BundledWorkflows.ts
- [x] Identified available workflows in resources/workflows directory
- [x] Found that 'slides' workflow exists but is not in the bundled list
- [x] Compare all available workflows vs bundled workflows list
- [x] Document exact reproduction steps
- [x] Identify which workflows are missing from BundledWorkflows.ts

### Completed
- [x] Created development plan file

## Analyze

### Phase Entrance Criteria:
- [x] Bug has been successfully reproduced
- [x] Exact steps to trigger the issue are documented
- [x] Error messages and logs are captured
- [x] Impact and affected workflows are identified

### Tasks
- [x] Analyze how BundledWorkflows.ts is used in the visualizer
- [x] Trace the code path from URL request to workflow loading
- [x] Understand why workflows need to be explicitly listed vs auto-discovered
- [x] Determine if there are any constraints on which workflows can be bundled
- [x] Identify the safest approach to include all workflows

### Completed
*None yet*

## Fix

### Phase Entrance Criteria:
- [x] Root cause has been identified and documented
- [x] Analysis shows clear understanding of why the bug occurs
- [x] Fix approach has been determined and documented

### Tasks
- [x] Update BundledWorkflows.ts to include all 20 workflows (WRONG APPROACH)
- [x] Verify the updated list matches available workflows
- [x] Test that the fix works locally
- [x] REVISED: Implement dynamic workflow discovery in BundledWorkflows.ts
- [x] Update [workflow].paths.js to use dynamic discovery
- [x] Test dynamic discovery works correctly
- [x] Fix path resolution to work in both dev and built environments
- [x] Fix build error: Remove Node.js dependencies from browser code
- [x] Add workflow list generation to build process
- [x] Fix [workflow].paths.js to work with new BundledWorkflows.ts format

### Completed
*None yet*

## Verify

### Phase Entrance Criteria:
- [ ] Fix has been implemented
- [ ] Code changes address the root cause
- [ ] Implementation follows the documented fix approach

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Finalize

### Phase Entrance Criteria:
- [ ] Bug fix has been verified and tested
- [ ] No regressions have been introduced
- [ ] All existing tests pass
- [ ] New tests (if needed) have been added

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
- **Root Cause Identified**: BundledWorkflows.ts contains only 6 workflows but 20 workflows exist in resources/workflows
- **Missing Workflows**: adr, big-bang-conversion, boundary-testing, business-analysis, c4-analysis, game-beginner, posts, sdd-bugfix, sdd-bugfix-crowd, sdd-feature, sdd-feature-crowd, sdd-greenfield, sdd-greenfield-crowd, slides
- **Reproduction Steps**: 
  1. Navigate to http://localhost:5174/responsible-vibe-mcp/workflows/slides
  2. VitePress loads but shows 404 error on the page
  3. Same happens for any workflow not in the bundled list
- **Analysis Complete**: 
  - VitePress uses [workflow].paths.js which reads BundledWorkflows.ts to generate static routes
  - WorkflowLoader.getAvailableWorkflows() only returns workflows from BundledWorkflows.ts
  - The hard-coded list was likely created when fewer workflows existed
  - No technical constraints prevent adding all workflows - they're all valid YAML files
- **Fix Approach REVISED**: Instead of hard-coding all workflows, implement dynamic discovery by reading the resources/workflows directory at build time
- **User Feedback**: Correctly identified that hard-coding a larger list is still the wrong approach - need dynamic discovery

## Notes
- Currently bundled: waterfall, epcc, tdd, bugfix, minor, greenfield (6 total)
- Available workflows: 20 total in resources/workflows directory
- The 'slides' workflow specifically mentioned by user is missing from bundled list

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
