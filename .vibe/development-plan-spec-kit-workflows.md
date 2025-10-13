# Development Plan: responsible-vibe (spec-kit-workflows branch)

*Generated on 2025-10-13 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Incorporate spec-kit's spec-driven development methodology and structured prompts into responsible-vibe-mcp workflows. Create new workflows that make specifications the centerpiece of development, using spec-kit's proven techniques for structured specification creation, planning, and task generation.

## Explore
### Tasks
- [ ] Analyze spec-kit's core methodology and principles
- [ ] Document key prompts and templates from spec-kit
- [ ] Identify integration opportunities with responsible-vibe-mcp
- [ ] Define scope of new spec-driven workflows to create
- [ ] Evaluate constitutional framework from spec-kit

### Completed
- [x] Created development plan file
- [x] Added phase entrance criteria
- [x] Analyzed spec-kit's core methodology and principles
- [x] Documented key prompts and templates from spec-kit
- [x] Identified integration opportunities with responsible-vibe-mcp
- [x] Defined scope of new spec-driven workflows to create
- [x] Evaluated constitutional framework from spec-kit
- [x] Created detailed implementation strategy for sdd domain workflows
- [x] Designed three sdd workflows (greenfield, feature, enhance)
- [x] Planned template system integration with constitutional compliance
- [x] Defined quality control mechanisms and validation approach

## Plan

### Phase Entrance Criteria:
- [x] Spec-kit methodology and techniques have been thoroughly analyzed
- [x] Key prompts and templates have been identified and documented
- [x] Integration approach with responsible-vibe-mcp has been evaluated
- [x] Scope of new workflows to be created is clearly defined

### Implementation Strategy

#### 1. SDD Domain Workflows
Create three new workflows in the "sdd" domain:

**sdd-greenfield**: Specification-driven development for new projects
- Phases: Constitution → Specify → Plan → Tasks → Implement → Document
- Focus: Complete spec-first development from scratch

**sdd-feature**: Unified specification-driven feature development and enhancement
- Phases: Analyze → Specify → Clarify → Plan → Tasks → Implement
- Focus: Adding new features or enhancing existing ones with spec-first approach
- Analyze phase is optional for new features, required for enhancements

**sdd-bugfix**: Test and specification-driven bugfix workflow
- Phases: Reproduce → Specify → Test → Plan → Fix → Verify
- Focus: Systematic bug fixing with test-first and spec-driven approach

#### 2. Core Components to Implement

**Templates System**:
- Specification template (adapted from spec-kit)
- Implementation plan template with constitutional gates
- Task breakdown template organized by user stories
- Constitution template for project governance

**Tool Integration**:
- `create_specification` tool for structured spec creation
- `create_implementation_plan` tool with constitutional compliance
- `generate_tasks` tool for user-story-based task breakdown
- `setup_constitution` tool for project governance

**Quality Control System**:
- Specification validation checklists
- Constitutional compliance gates
- Clarification management with `[NEEDS CLARIFICATION]` markers
- User story independence validation

### Tasks
- [x] Design workflow definitions for sdd domain
- [ ] Create sdd-greenfield workflow definition
- [ ] Create sdd-feature workflow definition (unified feature/enhance)
- [ ] Create sdd-bugfix workflow definition
- [ ] Implement specification template with MCP tool integration
- [ ] Implement implementation plan template with constitutional gates
- [ ] Implement task breakdown template with user story organization
- [ ] Create constitution template for project governance
- [ ] Add sdd domain to workflow system
- [ ] Create specification validation tools
- [ ] Implement constitutional compliance checking
- [ ] Add clarification management system
- [ ] Test workflow integration with existing system

### Detailed Implementation Plan

#### 1. SDD Workflow Definitions
Create three new workflows in the "sdd" domain:

**sdd-greenfield.yaml**: Complete spec-first development from scratch
- Phases: Constitution → Specify → Clarify → Plan → Tasks → Implement → Document
- Focus: New projects with comprehensive specification-first approach
- Constitutional framework establishment at the start

**sdd-feature.yaml**: Unified specification-driven feature development and enhancement
- Phases: Analyze → Specify → Clarify → Plan → Tasks → Implement
- Focus: Adding new features or enhancing existing ones with spec-first approach
- Analyze phase is optional for new features, required for enhancements

**sdd-bugfix.yaml**: Test and specification-driven bugfix workflow
- Phases: Reproduce → Specify → Test → Plan → Fix → Verify
- Focus: Systematic bug fixing with test-first and spec-driven approach
- Combines reproduction, specification, and test-driven development

#### 2. Template System Integration
Adapt spec-kit templates for responsible-vibe-mcp:
- Specification template with user story prioritization
- Implementation plan template with constitutional compliance gates
- Task breakdown template organized by independent user stories
- Constitution template for project governance principles

#### 3. Quality Control Mechanisms
- Specification validation checklists
- `[NEEDS CLARIFICATION]` marker management (max 3 per spec)
- Constitutional compliance gates in planning phase
- User story independence validation

### Completed
*None yet*

## Code

### Phase Entrance Criteria:
- [ ] Implementation plan for spec-driven workflows has been created
- [ ] Template structures and prompt designs have been finalized
- [ ] Integration points with existing responsible-vibe-mcp architecture are defined
- [ ] New workflow definitions and phases have been specified

### Tasks
- [x] Create sdd-greenfield workflow definition
- [x] Create sdd-feature workflow definition (unified feature/enhance)
- [x] Create sdd-bugfix workflow definition
- [x] Implement specification template with MCP tool integration
- [x] Implement implementation plan template with constitutional gates
- [x] Implement task breakdown template with user story organization
- [x] Create constitution template for project governance
- [x] Add sdd domain to workflow system
- [ ] Create specification validation tools
- [ ] Implement constitutional compliance checking
- [ ] Add clarification management system
- [x] Test workflow integration with existing system

### Completed
- [x] Created sdd-greenfield workflow definition with constitutional framework and spec-kit methodology
- [x] Created unified sdd-feature workflow combining feature development and enhancement capabilities
- [x] Created sdd-bugfix workflow integrating test-driven and specification-driven bug fixing
- [x] Incorporated spec-kit prompts and templates into workflow instructions
- [x] Implemented constitutional compliance gates and quality control mechanisms
- [x] **CRITICAL FIX**: Removed spec-kit references and inlined actual templates and content
- [x] Added constitutional framework template as additional_instructions
- [x] Added feature specification template as additional_instructions
- [x] Added bug specification template as additional_instructions
- [x] **VARIABLE SYSTEM**: Implemented $SPEC_DIR variable for dynamic branch-based file organization
- [x] Updated ProjectDocsManager.getVariableSubstitutions() to accept gitBranch parameter
- [x] Updated InstructionGenerator to pass gitBranch to variable substitution
- [x] Updated sdd-greenfield workflow to use $SPEC_DIR variable

## Commit

### Phase Entrance Criteria:
- [ ] New spec-driven workflows have been implemented and tested
- [ ] Templates and prompts have been integrated into the system
- [ ] Documentation has been created for the new workflows
- [ ] Integration with existing workflows is complete and functional

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions

### Spec-Kit Methodology Analysis
**Decision**: Adopt spec-kit's core SDD principles for new workflows
**Rationale**: Spec-kit's approach of making specifications executable and the centerpiece of development aligns perfectly with responsible-vibe-mcp's structured workflow approach

### Key Techniques Identified
1. **Constitutional Framework**: Nine immutable principles that govern development
2. **Structured Command System**: `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` workflow
3. **Template-Driven Quality**: Templates that constrain LLM behavior for better outcomes
4. **User Story Organization**: Tasks organized by user story for independent implementation
5. **Clarification Management**: Systematic handling of ambiguities with `[NEEDS CLARIFICATION]` markers

### Integration Approach
**Decision**: Create new spec-driven workflows that complement existing responsible-vibe-mcp workflows
**Rationale**: Rather than replacing existing workflows, add new ones that focus on specification-first development for projects that benefit from this approach

### SDD Domain Decision
**Decision**: Use "sdd" domain for new specification-driven development workflows
**Rationale**: Clear separation from existing "code" domain workflows, allowing users to choose between traditional and spec-first approaches

### Workflow Merge Decision
**Decision**: Merge sdd-feature and sdd-enhance into single unified sdd-feature workflow
**Rationale**: Both workflows have fundamentally the same steps with only one additional analysis phase difference. The unified workflow includes an optional Analyze phase that can be skipped for new features but used for enhancements, eliminating duplication while maintaining functionality.

### $BRANCH_DIR Variable Implementation
**Decision**: Implement new $BRANCH_DIR variable for dynamic branch-based file organization under .vibe/specs/
**Rationale**: Following spec-kit's approach but maintaining consistency with responsible-vibe's .vibe/ structure. Each feature/branch gets its own folder under .vibe/specs/{branch-name}/ for organization.
**Implementation**: 
- **Added $BRANCH_DIR variable** to ProjectDocsManager.getVariableSubstitutions()
- **Branch-aware path generation**: `.vibe/specs/{gitBranch}/` for feature branches, `.vibe/specs/current/` for main/master
- **Updated instruction generator** to pass gitBranch from ConversationContext
- **Updated workflows** to use `$BRANCH_DIR/spec.md`, `$BRANCH_DIR/plan.md`, etc.
- **Maintains .vibe structure**: All specs organized under .vibe/specs/ alongside other .vibe/ artifacts

## Notes

### Spec-Kit Core Components Analyzed
- **spec-driven.md**: Complete methodology documentation
- **templates/commands/**: Structured prompts for specify, plan, tasks commands
- **templates/spec-template.md**: Template for feature specifications with user stories
- **templates/plan-template.md**: Implementation planning template
- **templates/tasks-template.md**: Task breakdown template organized by user story
- **memory/constitution.md**: Constitutional framework template

### Key Insights
1. **Power Inversion**: Code serves specifications, not the other way around
2. **Template Constraints**: Templates guide LLM behavior toward higher-quality outputs
3. **Phase Gates**: Constitutional compliance enforced through checkpoints
4. **Independent User Stories**: Each story can be implemented and tested independently
5. **Systematic Clarification**: Structured approach to handling ambiguities

### Integration Opportunities
- Create spec-driven workflows for responsible-vibe-mcp
- Adapt spec-kit templates for MCP tool integration
- Implement constitutional framework for project governance
- Add specification-first development phases to existing workflows

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
