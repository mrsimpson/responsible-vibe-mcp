# Development Plan: responsible-vibe (configure-available-workflows branch)

*Generated on 2025-09-11 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Allow users to configure which workflows are enabled/available in a project to reduce confusion and prevent selecting inappropriate workflows.

## Explore
### Tasks
- [ ] Understand current workflow selection mechanism
- [ ] Research configuration file formats and locations
- [ ] Identify integration points in the codebase
- [ ] Define configuration schema and user experience

### Completed
- [x] Created development plan file
- [x] Analyzed current workflow system in WorkflowManager class
- [x] Found workflow enum generation in server-config.ts
- [x] Identified .vibe directory as configuration location
- [x] Decided on simple allowlist format with strict error handling

## Plan

### Phase Entrance Criteria:
- [x] The problem space has been thoroughly explored
- [x] Current workflow selection mechanism is understood
- [x] Configuration requirements are clearly defined
- [x] Technical approach has been researched

### Tasks
- [x] Create ConfigManager class for .vibe/config.yaml handling
- [x] Modify WorkflowManager.getAvailableWorkflowsForProject() to apply filtering
- [x] Add validation logic with descriptive error messages
- [x] Ensure errors fail server startup appropriately
- [x] Plan testing for valid/invalid configs and backward compatibility
- [x] Confirmed scope: focus on workflow filtering only

### Completed
- [x] Designed implementation strategy
- [x] Identified specific code changes needed
- [x] Planned error handling approach
- [x] Scoped feature to workflow filtering only

## Code

### Phase Entrance Criteria:
- [ ] Implementation plan is complete and detailed
- [ ] Configuration format and location are decided
- [ ] Integration points with existing code are identified
- [ ] User experience for configuration is designed

### Tasks
- [x] Create ConfigManager class in src/config-manager.ts
- [x] Add YAML parsing and validation logic
- [x] Modify WorkflowManager constructor to load config
- [x] Update getAvailableWorkflowsForProject() to apply filtering
- [x] Add comprehensive error handling with descriptive messages
- [x] Write tests for valid/invalid configs and backward compatibility
- [x] Add tests for list_workflows tool integration with configuration filtering
- [ ] Publish new version with configuration feature

### Completed
- [x] Created ConfigManager class with YAML loading and validation
- [x] Modified WorkflowManager to integrate configuration filtering
- [x] Added comprehensive error handling for all edge cases
- [x] Implemented custom workflow support in configuration
- [x] Created comprehensive test suite with 11 test cases
- [x] Added list_workflows tool integration tests
- [x] All tests passing (265/265)
- [x] Identified that feature needs to be published for user access

## Commit

### Phase Entrance Criteria:
- [ ] Core functionality is implemented and working
- [ ] Configuration can be read and applied correctly
- [ ] Workflow filtering is functional
- [ ] Basic testing is complete
### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
- Configuration will be stored in `.vibe/config.yaml` file
- **Simple allowlist format**: `enabled_workflows: [workflow1, workflow2]`
- **Strict error handling**: Any configuration errors fail startup
- Will extend WorkflowManager to filter workflows based on configuration
- Will maintain backward compatibility (no config = all workflows available)
- **New ConfigManager class** to handle YAML loading and validation
- **Modify getAvailableWorkflowsForProject()** to apply config filtering

## Notes
**Current Workflow System Analysis:**
- WorkflowManager loads predefined workflows from resources/workflows directory
- Workflows are exposed via `getAvailableWorkflows()` and `getAvailableWorkflowsForProject()`
- Server-config.ts uses `buildWorkflowEnum()` to generate tool schema
- Custom workflows are supported via `.vibe/workflow.yaml`

**Configuration Format:**
```yaml
# .vibe/config.yaml
enabled_workflows:
  - waterfall
  - epcc
  - bugfix
```

**Error Handling:**
- Invalid workflow names → fail startup
- Malformed YAML → fail startup  
- Empty allowlist → fail startup
- No config file → all workflows available (backward compatibility)

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
