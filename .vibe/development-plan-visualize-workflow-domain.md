# Development Plan: responsible-vibe (visualize-workflow-domain branch)

*Generated on 2025-10-01 by Vibe Feature MCP*
*Workflow: [minor](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/minor)*

## Goal
Enhance the workflow-visualizer docs page to show domain filtering - which workflows are enabled/loaded vs all available workflows, helping users understand what's accessible in their project context.

## Explore
### Tasks
- [x] Analyze existing workflow metadata structure
- [x] Examine current list_workflows implementation  
- [x] Find workflow-visualizer tool and understand its purpose
- [x] Understand domain filtering via enabled_workflows config
- [x] Determine how to show enabled vs available workflows in visualizer
- [x] Design UI approach for domain visualization
- [x] Verify workflows already have domain metadata

### Completed
- [x] Created development plan file
- [x] Found workflow-visualizer in /workflow-visualizer directory
- [x] Discovered enabled_workflows config filtering in WorkflowManager
- [x] Located WorkflowLoader service that loads built-in workflows
- [x] Clarified approach: show all workflows with domain pills in dropdown
- [x] Confirmed workflows already have domain: 'code', 'architecture', 'office'

## Implement

### Phase Entrance Criteria:
- [x] The workflow metadata structure has been analyzed and understood
- [x] Visualization approach has been designed
- [x] Implementation scope is clearly defined

### Tasks
- [x] Update WorkflowLoader to include domain in WorkflowMetadata type
- [x] Modify workflow title to display domain pill next to .workflow-title-clickable
- [x] Add CSS styling for domain pills with color coding
- [x] Test the visualization builds successfully

### Completed
- [x] Added domain field to WorkflowMetadata interface
- [x] Updated PlantUMLRenderer to show domain pill in main workflow title
- [x] Added domain-specific CSS styling (code=blue, architecture=yellow, office=green)
- [x] Successfully built visualizer with domain pill feature in correct location
- [x] Committed changes with conventional commit message
- [x] Verified all linting and TypeScript checks pass

## Finalize

### Phase Entrance Criteria:
- [ ] Visualization code has been implemented
- [ ] Basic testing has been completed
- [ ] Code is ready for cleanup and finalization

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
- **Target**: Update workflow-visualizer to display existing domain metadata as pills
- **Existing Domains**: code, architecture, office (already in workflow YAML files)
- **Implementation**: Only need to update visualizer to read and display domain from metadata
- **Scope Reduced**: No need to add domain metadata - it already exists!

## Notes
**Proposed Domain Categories:**
- **Development**: waterfall, epcc, bugfix, minor, greenfield (core development workflows)
- **Analysis**: c4-analysis, business-analysis, boundary-testing, big-bang-conversion (system analysis workflows)  
- **Content**: posts, slides (content creation workflows)

**Implementation Steps:**
1. Update YamlStateMachine type to include domain in metadata
2. Add domain field to all 11 workflow YAML files
3. Update workflow-visualizer to read and display domain pills

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
