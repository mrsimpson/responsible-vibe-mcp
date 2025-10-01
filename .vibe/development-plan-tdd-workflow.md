# Development Plan: responsible-vibe (tdd-workflow branch)

*Generated on 2025-10-01 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Create a new Test-Driven Development (TDD) workflow for the responsible-vibe-mcp server that guides developers through the TDD cycle: Red → Green → Refactor.

## Explore
### Tasks
- [x] Analyze existing workflow structure and patterns
- [x] Understand YAML workflow format and schema requirements
- [x] Identify workflow loading mechanism in WorkflowManager
- [x] Define TDD workflow phases (Red, Green, Refactor cycle)
- [x] Understand TDD requirements and user expectations
- [x] Map TDD phases to workflow states with appropriate transitions

### Completed
- [x] Created development plan file
- [x] Found workflows are stored in `/resources/workflows/` as YAML files
- [x] Identified schema at `/resources/state-machine-schema.json`
- [x] Analyzed existing workflows (epcc, bugfix) for patterns
- [x] Understood WorkflowManager loads workflows automatically from filename
- [x] **TDD Workflow Design**: 4 phases - explore → red → green → refactor (with cycles)

## Plan

### Phase Entrance Criteria:
- [x] The TDD workflow requirements have been thoroughly defined
- [x] Existing workflow structure and patterns have been analyzed
- [x] TDD cycle phases (Red, Green, Refactor) have been mapped to workflow states
- [x] Integration points with the existing system are understood

### Tasks
- [x] Design YAML structure following state-machine-schema.json
- [x] Define metadata for workflow discoverability
- [x] Create state definitions with appropriate instructions
- [x] Design transition logic between states
- [x] Plan instruction templates for each phase
- [x] Validate against existing workflow patterns

### Completed
- [x] Complete TDD workflow structure designed
- [x] YAML format planned following schema requirements
- [x] State transitions mapped for TDD cycle
- [x] Instruction templates defined for each phase

## Code

### Phase Entrance Criteria:
- [ ] The TDD workflow structure has been designed
- [ ] Implementation approach has been documented
- [ ] File locations and naming conventions have been determined
- [ ] Integration strategy with existing workflows is clear

### Tasks
- [x] Create `/resources/workflows/tdd.yaml` file
- [x] Implement workflow metadata section
- [x] Implement explore state with instructions and transitions
- [x] Implement red state with test type consultation
- [x] Implement green state with minimal code focus
- [x] Implement refactor state with improvement guidance
- [x] Add transition logic between all states
- [x] Test workflow loads correctly in WorkflowManager

### Completed
- [x] TDD workflow YAML file created with all 4 phases
- [x] Quality gates integrated (test validation, no dirty hacks)
- [x] Language improved to avoid encouraging shortcuts
- [x] Additional instructions cleaned up to only include one-time actions

## Commit

### Phase Entrance Criteria:
- [x] TDD workflow implementation is complete and functional
- [x] All tests pass and existing functionality is preserved
- [x] Code follows project conventions and standards
- [x] Documentation has been updated to include the new workflow

### Tasks
- [x] Code cleanup (no debug output, TODOs, or experimental code to remove)
- [x] Documentation review (no long-term memory docs need updating)
- [x] Final validation (all 260 tests pass)
- [x] Verify TDD workflow loads correctly in system

### Completed
- [x] TDD workflow successfully integrated into responsible-vibe-mcp
- [x] All existing functionality preserved (260/260 tests pass)
- [x] Code quality maintained with proper YAML structure
- [x] Ready for production deployment

### Completed
*None yet*

## Key Decisions
- **Workflow Format**: TDD workflow will be implemented as a YAML file following the existing schema
- **File Location**: `/resources/workflows/tdd.yaml` (automatically loaded by WorkflowManager)
- **Schema Compliance**: Must follow `/resources/state-machine-schema.json` structure
- **TDD Phases**: 4 states - explore → red → green → refactor (with cycle transitions)
- **Test Types**: Framework-agnostic, LLM asks user about test type when transitioning to red phase
- **Complexity**: Simple workflow focusing on core TDD cycle
- **Failure Handling**: Revert to user for clarification on any issues
- **Exit Strategy**: User can abandon/abort at any time (no explicit exit modeling needed)
- **Quality Gates**: 
  - **Test Quality**: Validate with user that tests actually test what needs to be developed
  - **Implementation Quality**: Verify no dirty hacks (e.g., assert(true), hardcoded values)
- **Language Choice**: Use "write only the necessary code" instead of "write minimal code" to avoid encouraging shortcuts

## Notes

### TDD Workflow Structure
**States:**
1. **explore** - Initial exploration phase (like epcc), understand requirements and codebase
2. **red** - Write failing test (ask user about test type: unit/integration/etc.)
3. **green** - Write minimal code to make test pass
4. **refactor** - Improve code while keeping tests green

**Transitions:**
- explore → red (exploration complete)
- red → green (failing test written)
- green → refactor (test passes)
- refactor → red (start new TDD cycle)
- Any state → explore (abandon/restart)

**Key Features:**
- Framework-agnostic instructions
- User consultation on test types
- Simple cycle-based approach
- Flexible abandonment at any point

### YAML Structure Plan
```yaml
name: 'tdd'
description: 'Test-Driven Development workflow: Explore → Red → Green → Refactor cycle'
initial_state: 'explore'
metadata:
  complexity: 'medium'
  bestFor: ['TDD development', 'Test-first coding', 'Quality-focused development']
  examples: ['Add new feature with tests', 'Refactor existing code safely']
states:
  explore: # Understanding phase
  red:     # Write failing test
  green:   # Make test pass
  refactor: # Improve code
```

### Instruction Templates
**explore**: Research codebase, understand requirements, document findings
**red**: Ask user about test type, write failing test that defines expected behavior. **VALIDATE with user that test actually tests what needs to be developed**
**green**: Write minimal code to make the test pass. **VERIFY no dirty hacks (assert(true), hardcoded values, etc.)**
**refactor**: Improve code quality while keeping all tests green (cleanup phase)

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
