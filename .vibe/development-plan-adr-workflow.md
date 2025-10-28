# Development Plan: responsible-vibe (adr-workflow branch)

*Generated on 2025-10-27 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Create a structured workflow for writing Architecture Decision Records (ADRs) that can be integrated into the responsible-vibe-mcp system. The workflow should guide users through the process of documenting architectural decisions systematically.

## Explore
### Tasks
- [ ] Research ADR (Architecture Decision Record) formats and best practices
- [ ] Analyze existing workflow structures in responsible-vibe-mcp
- [ ] Define phases for ADR writing workflow
- [ ] Identify key components of effective ADRs
- [ ] Determine integration points with responsible-vibe-mcp system
- [ ] Research common ADR templates (MADR, Y-Statements, etc.)

### Completed
- [x] Created development plan file
- [x] Set up phase entrance criteria
- [x] Examined existing workflow structures (my-posts.yaml, tdd.yaml)
- [x] Defined ADR workflow requirements and phases
- [x] Identified key ADR components and structure
- [x] Analyzed integration approach with responsible-vibe-mcp

## Plan

### Phase Entrance Criteria:
- [x] ADR workflow requirements have been thoroughly researched and documented
- [x] Existing ADR formats and best practices have been analyzed
- [x] Integration points with responsible-vibe-mcp have been identified
- [x] User needs and workflow phases have been clearly defined

### Implementation Strategy:

**1. Workflow Structure Design:**
- Create `adr.yaml` workflow file following existing patterns
- Define 4 phases: `context` → `research` → `decide` → `review`
- Each phase guides user through structured ADR development
- Include appropriate transitions and validation points

**2. ADR Template Integration:**
- Support multiple ADR formats (MADR, Y-Statement, Simple)
- Provide template selection in context phase
- Generate structured ADR documents during workflow

**3. Workflow Phases:**
- **Context**: Define architectural problem/decision needed, identify stakeholders
- **Research**: Investigate options, gather information, analyze alternatives and trade-offs
- **Decide**: Make the actual decision, document chosen option with clear rationale
- **Commit**: Finalize ADR with review validation from multiple perspectives (architect, stakeholder, implementer)

**4. ADR Storage Strategy:**
- Use $ARCHITECTURE_DOC path to determine ADR location
- If $ARCHITECTURE_DOC exists, include ADRs there or in related structure
- Analyze existing ADRs to match format, or use provided template if none exist

### Tasks
- [x] Design workflow metadata and phase structure
- [x] Define phase instructions and transitions
- [x] Plan ADR template integration approach using $ARCHITECTURE_DOC
- [x] Design ADR storage location strategy based on $ARCHITECTURE_DOC
- [x] Clarify decide vs review phase responsibilities
- [x] Plan opinionated template inclusion in workflow instructions

### Completed
- [x] Created detailed implementation strategy
- [x] Defined workflow phases and transitions with clear separation of concerns
- [x] Planned integration approach using $ARCHITECTURE_DOC for ADR location
- [x] Specified template strategy with fallback to opinionated simple template

### Completed
*None yet*

## Code

### Phase Entrance Criteria:
- [x] Detailed implementation plan for ADR workflow has been created
- [x] Workflow phases and transitions have been defined
- [x] Integration approach with responsible-vibe-mcp has been planned
- [x] Template structures and guidance content have been specified

### Tasks
- [x] Create `adr.yaml` workflow file with metadata and phase definitions
- [x] Implement context phase with problem definition guidance
- [x] Implement research phase with option analysis structure
- [x] Implement decide phase with decision documentation
- [x] Implement commit phase with multi-perspective review validation
- [x] Add review perspectives for transition to commit (architect, stakeholder, implementer)
- [x] Add ADR template selection and generation logic
- [x] Test workflow integration with responsible-vibe-mcp
- [x] Create example ADR using the workflow

### Completed
- [x] Successfully implemented complete ADR workflow
- [x] All phases implemented with proper instructions and transitions  
- [x] Multi-perspective review validation added to decide→commit transition
- [x] Template integration with $ARCHITECTURE_DOC location detection
- [x] Workflow tested and confirmed working in responsible-vibe-mcp
- [x] Added CLI validation command using existing StateMachineLoader
- [x] Fixed workflow validation issues (missing transitions in commit state)

## Commit

### Phase Entrance Criteria:
- [ ] ADR workflow has been implemented and tested
- [ ] All workflow files and templates have been created
- [ ] Integration with responsible-vibe-mcp is functional
- [ ] Documentation and examples have been prepared

### Tasks
- [ ] Clean up development artifacts and finalize workflow file
- [ ] Validate ADR workflow integration with responsible-vibe-mcp
- [ ] Test complete workflow flow from context to commit
- [ ] Finalize documentation and usage examples
- [ ] Review workflow completeness from multiple perspectives

### Completed
*None yet*

## Key Decisions

### ADR Workflow Requirements Identified:
- **Purpose**: ADRs document significant architectural decisions with context, options considered, and rationale
- **Common ADR Components**: 
  - Title/Decision
  - Status (Proposed, Accepted, Deprecated, Superseded)
  - Context/Problem Statement
  - Decision
  - Consequences (positive and negative)
  - Alternatives Considered
- **Workflow Phases Needed**:
  1. **Context** - Define the architectural problem/decision needed
  2. **Research** - Investigate options and gather information
  3. **Decide** - Make the decision and document rationale
  4. **Review** - Validate and finalize the ADR
- **Integration**: Should work as a custom workflow in responsible-vibe-mcp system

### Planning Decisions:
- **Workflow Name**: `adr` (Architecture Decision Records)
- **Domain**: `architecture` - specialized for architectural decision making
- **Complexity**: `medium` - structured process requiring thoughtful analysis
- **ADR Location**: Use $ARCHITECTURE_DOC path to determine where ADRs should be stored/included
- **Template Strategy**: Include opinionated simple template in workflow instructions; use existing format if ADRs already exist
- **Phase Separation**:
  - **Decide Phase**: Make the actual decision, document the chosen option and rationale
  - **Commit Phase**: Finalize ADR with multi-perspective review validation (architect, stakeholder, implementer)
- **Phase Flow**: Linear progression with ability to return to previous phases for refinement

## Notes

### ADR Workflow Analysis:
- **Domain**: Should be 'architecture' or 'office' domain
- **Complexity**: Medium - requires structured thinking but not complex implementation
- **Best For**: Documenting architectural decisions, design choices, technology selections
- **Phases**: Context → Research → Decide → Review (similar to other structured workflows)
- **Templates**: Need to support common ADR formats (MADR, Y-Statements, simple format)
- **Integration**: Will be a YAML workflow file like existing my-posts.yaml and tdd.yaml

### Workflow Structure Insights:
- Each phase needs clear description and default_instructions
- Transitions should have triggers and transition_reasons
- Metadata section helps with discoverability
- Instructions should guide user through structured decision-making process

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
