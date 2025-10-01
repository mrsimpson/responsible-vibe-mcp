# Development Plan: responsible-vibe (workflow-library branch)

*Generated on 2025-10-01 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Optimize workflow selection and reduce context size by improving how workflows are presented to LLMs. The current system has too many workflows with verbose descriptions making selection difficult and context bloated.

## Explore
### Tasks
- [x] Analyzed current workflow system architecture
- [x] Identified the problem areas (context size, selection difficulty)
- [x] Examined workflow loading and presentation mechanism
- [x] Reviewed current workflow metadata structure
- [x] Analyzed current workflow count and description lengths
- [x] Research alternative approaches for workflow selection
- [x] Analyze LLM context limitations and optimization strategies
- [x] Evaluate potential solutions (lazy loading, categorization, smart filtering)

### Completed
- [x] Created development plan file

## Plan

### Phase Entrance Criteria:
- [x] Current workflow system has been analyzed and understood
- [x] Problem areas have been identified (context size, selection difficulty)
- [x] Alternative approaches have been researched
- [x] Solution strategy has been defined

### Tasks
- [x] Design two-step workflow selection architecture
- [x] Define workflow categorization system (complexity-based grouping)
- [x] Plan new tool: `list_workflows` for detailed workflow information
- [x] Design simplified `start_development` tool schema
- [x] Plan backward compatibility considerations
- [x] Design configuration options for workflow filtering
- [x] Plan testing strategy for new workflow selection system
- [x] **REVISED**: Design domain-based workflow classification system
- [x] **NEW**: Plan ENV variable control mechanism (`VIBE_WORKFLOW_DOMAINS`)
- [x] **NEW**: Design workflow installation tool for .vibe directory
- [x] **NEW**: Plan selective workflow loading based on domains
- [x] **CRITICAL**: Design multi-workflow loader for `.vibe/workflows/` directory

### Completed
*None yet*

## Code

### Phase Entrance Criteria:
- [ ] Implementation plan has been created and approved
- [ ] Technical approach has been decided
- [ ] Impact on existing functionality has been assessed
- [ ] Clear tasks for implementation have been defined

### Tasks
- [x] Add `domain` metadata to all workflow YAML files
- [x] Implement domain filtering in `WorkflowManager.loadPredefinedWorkflows()`
- [x] Create ENV variable parsing for `VIBE_WORKFLOW_DOMAINS`
- [x] **CRITICAL**: Implement `WorkflowManager.loadProjectWorkflows()` for `.vibe/workflows/`
- [x] **CRITICAL**: Update workflow loading logic to merge multiple sources
- [x] Update `list_workflows` tool to respect domain filtering with `include_unloaded` option
- [x] **FIXED**: Add missing domain metadata to all workflow files
- [x] Implement `install_workflow` tool handler
- [x] Create workflow installation logic (download, validate, store)
- [x] **FIXED**: Reload workflows after installation for immediate availability
- [x] **FIXED**: Project workflows ignore domain filtering (always available)
- [x] **TESTS**: Add comprehensive tests for workflow functionality
- [x] Update `start_development` tool to work with filtered workflows
- [x] Handle workflow name conflicts between sources (project workflows prioritized)
- [x] Update existing tests for multi-source workflow loading
- [x] **FIXED**: Remove DEFAULT_WORKFLOW_NAME dependency - use first available workflow
- [x] **FIXED**: Handle case where no workflows are available in error messages
- [ ] Update documentation for new workflow management system

### Completed
*None yet*

## Commit

### Phase Entrance Criteria:
- [x] Core implementation is complete and functional
- [x] Changes have been tested and don't break existing functionality
- [x] Code is clean and ready for production
- [ ] Documentation reflects the final implementation

### Tasks
- [x] **Code Cleanup**: Review code for debug statements, TODOs, and temporary code
- [x] **Code Quality**: Verify no debugging artifacts remain in production code
- [x] **Documentation Update**: Update project documentation to reflect workflow library system
- [x] **Final Validation**: Run comprehensive tests to ensure system integrity
- [x] **Legacy Migration**: Implement automatic migration from .vibe/workflow.yaml to .vibe/workflows/custom.yaml
- [x] **Remove Legacy References**: Clean up old workflow.yaml references throughout codebase
- [x] **Fix validateWorkflowName**: Update validateWorkflowName to recognize project workflows
- [x] **Fix Workflow Enum**: Include project workflows in start_development tool's workflow enum
- [ ] **User Review**: Present final implementation for user approval

### Completed
*None yet*

## Key Decisions
- **Current Problem**: The system loads 12 workflows with verbose descriptions, creating large context and making LLM selection difficult
- **Root Cause**: All workflows are presented in a single enum with full descriptions in the `start_development` tool schema
- **Current Architecture**: WorkflowManager loads all workflows, server-helpers generates full descriptions for tool schema
- **Quantified Impact**: 5,320 characters total description, 443 chars average per workflow, making tool schema very verbose
- **UPDATED Solution**: Domain-based workflow classification with selective loading
- **User's Better Approach**: 
  1. Classify workflows by domain (code, architecture, office)
  2. Load workflow sets based on classification
  3. ENV variable for user control (e.g., `VIBE_WORKFLOW_DOMAINS=code,architecture`)
  4. Tool to install workflows into .vibe directory as additional workflows

## Notes
**Current Workflow System Analysis:**
- 12 predefined workflows in `/resources/workflows/` directory
- Each workflow has metadata: complexity, bestFor, useCases, examples
- `generateWorkflowDescription()` creates verbose descriptions for all workflows
- All workflows presented in single enum in `start_development` tool
- Context bloat occurs in tool schema generation

**Quantified Problem:**
- Total description: 5,320 characters
- Average per workflow: 443 characters
- Longest: business-analysis (250 chars), boundary-testing (225 chars)
- Shortest: tdd (104 chars), bugfix (119 chars)

**Key Files:**
- `src/workflow-manager.ts` - Loads and manages workflows
- `src/server/server-helpers.ts` - Generates workflow descriptions
- `src/server/server-config.ts` - Registers tools with workflow enum
- `resources/workflows/*.yaml` - Individual workflow definitions

**Alternative Approaches to Research:**
1. **Two-step selection**: Simple enum first, then detailed info tool
2. **Categorization**: Group workflows by complexity/type
3. **Smart filtering**: Context-aware workflow suggestions
4. **Lazy loading**: Load descriptions only when needed
5. **Abbreviated descriptions**: Shorter initial descriptions with detail tool

**Research Findings:**
- **LLM Context Limits**: Most LLMs work better with concise, focused options
- **Cognitive Load**: 12+ options with verbose descriptions overwhelm decision-making
- **MCP Best Practices**: Tools should have minimal, focused schemas
- **User Experience**: Users often know their use case but not workflow names

**Recommended Solution: Two-Step Selection**
1. **Step 1**: `start_development` with simplified workflow categories
2. **Step 2**: `list_workflows` tool for detailed workflow information
3. **Benefits**: Reduced context, better UX, maintains full functionality

**UPDATED Implementation Plan (User's Better Approach):**

**1. Domain-Based Workflow Classification:**
- **code**: epcc, waterfall, tdd, bugfix, minor, greenfield (software development)
- **architecture**: c4-analysis, big-bang-conversion, boundary-testing (system analysis)
- **office**: posts, slides, business-analysis (content/documentation)

**2. ENV Variable Control:**
- `VIBE_WORKFLOW_DOMAINS=code,architecture` - Load only specified domains
- Default: load only 'code' domain if not specified (reduces context significantly)
- Validation: warn about unknown domains, continue with valid ones

**3. Workflow Installation Tool:**
- New tool: `install_workflow` 
- Downloads workflow from URL/registry into `.vibe/workflows/`
- Treats installed workflows as additional available workflows
- Supports versioning and updates

**4. Multi-Workflow Loading Architecture:**
- **Current**: Single custom workflow (`.vibe/workflow.yaml`)
- **New**: Multiple workflows in `.vibe/workflows/*.yaml`
- **Backward Compatibility**: Keep supporting single custom workflow
- **Loading Priority**: Predefined → Custom single → Custom multiple
- **Conflict Resolution**: Installed workflows can override predefined ones

**4. Selective Loading Architecture:**
- Modify `WorkflowManager` to filter by domains
- Load workflows based on ENV variable + installed workflows
- Significantly reduce context by loading only relevant workflow sets

**5. Technical Implementation:**
- Add `domain` metadata to workflow YAML files
- Modify `WorkflowManager.loadPredefinedWorkflows()` for domain filtering
- **NEW**: Add `WorkflowManager.loadProjectWorkflows()` for `.vibe/workflows/`
- Create `InstallWorkflowHandler` for workflow installation
- Update configuration system to respect domain filtering
- **CRITICAL**: Modify workflow loading logic to handle multiple sources

**6. Benefits of This Approach:**
- **Massive Context Reduction**: Load only 3-4 workflows instead of 12
- **User Control**: ENV variable allows customization per environment
- **Extensibility**: Users can install additional workflows as needed
- **Domain Focus**: Workflows grouped by actual use case domains
- **Backward Compatibility**: Existing setups continue to work

**7. Example Usage:**
```bash
# Default: Load only code workflows (waterfall, epcc, tdd, bugfix, minor, greenfield)
# No ENV variable needed

# Load code and architecture workflows
export VIBE_WORKFLOW_DOMAINS=code,architecture

# Load all domains
export VIBE_WORKFLOW_DOMAINS=code,architecture,office

# Install a custom workflow
# (via MCP tool: install_workflow({url: "https://...", name: "custom-ci"}))
```

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
