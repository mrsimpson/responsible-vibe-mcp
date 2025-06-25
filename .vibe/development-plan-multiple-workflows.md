# Development Plan: responsible-vibe (multiple-workflows branch)

*Generated on 2025-06-23 by Vibe Feature MCP*
*Workflow: Explore-Plan-Code-Commit Workflow*

## Project Overview

**Status**: Explore Phase  
**Current Phase**: Explore  
**Workflow**: A comprehensive development workflow based on Anthropic's best practices: Explore, Plan, Code, Commit based on https://www.anthropic.com/engineering/claude-code-best-practices

### Feature Goals
- [ ] *To be defined based on explore phase*

### Scope
- [ ] *To be defined during explore phase*

## Current Status

**Phase**: Explore  
**Progress**: Starting development with Research and exploration phase - understanding the problem space

### Current Phase Tasks
- [ ] *Tasks will be added as they are identified*

### Completed
- [x] Created development plan file

## Explore

*Research and exploration phase - understanding the problem space*

### Tasks
- [x] Understand current workflow system architecture
- [x] Analyze existing state machine implementation
- [x] Review current start_development tool implementation
- [x] Examine StateMachineLoader and TransitionEngine components
- [x] Understand YamlStateMachine type structure
- [x] Design multiple workflow support architecture
- [x] Define the three target workflows (waterfall, epcc, bug-fixing)
- [x] Plan the enhanced start_development tool interface

### Completed
- [x] Analyzed current server.ts implementation
- [x] Reviewed state-machine.yaml structure (waterfall workflow)
- [x] Understood current start_development tool flow
- [x] Found state machine loader and transition engine components
- [x] Analyzed StateMachineLoader.loadStateMachine() method
- [x] Understood how custom workflows are loaded from .vibe/state-machine.yaml
- [x] Reviewed YamlStateMachine type definitions
- [x] Created three workflow YAML files in resources/workflows/
- [x] Designed architecture for multiple workflow support
- [x] Planned enhanced start_development tool interface with workflow selection

## Plan

*Planning phase - creating a detailed implementation strategy*

### Implementation Strategy

#### 1. Workflow Management System
- **Create WorkflowManager class** to handle multiple predefined workflows
- **Extend StateMachineLoader** to support loading from resources/workflows/ directory
- **Add workflow discovery** to find and list available workflows
- **Maintain backward compatibility** with existing custom workflow system

#### 2. Enhanced start_development Tool
- **Add workflow parameter** with enum of available workflows
- **Include workflow descriptions** in parameter documentation
- **Default to waterfall workflow** for backward compatibility
- **Validate workflow selection** before initialization

#### 3. Workflow Definitions
- **Three predefined workflows**:
  - `waterfall`: Classical waterfall (idle→requirements→design→implementation→qa→testing→complete)
  - `epcc`: Explore-Plan-Code-Commit workflow for smaller features
  - `bugfix`: Bug fixing workflow (reproduce→analyze→fix→verify)
- **Custom workflow support** remains via .vibe/state-machine.yaml

#### 4. Database Schema Updates
- **Add workflow_name field** to conversation_states table
- **Store selected workflow** for conversation continuity
- **Migration script** for existing conversations

### Tasks
- [x] Create WorkflowManager class design
- [x] Plan StateMachineLoader extensions for predefined workflows
- [x] Design start_development tool enhancement with workflow parameter
- [x] Plan workflow descriptions for tool documentation
- [x] Design database schema updates with workflow_name field
- [x] Plan database migration script approach
- [x] Design ConversationManager workflow selection integration
- [x] Plan TransitionEngine workflow usage updates
- [x] Design workflow validation logic
- [x] Plan system prompt documentation updates
- [x] Plan comprehensive test coverage for multiple workflows
- [x] Define implementation phases and file changes
- [x] Design workflow selection priority logic

### Completed
- [x] Created comprehensive implementation strategy
- [x] Designed WorkflowManager class architecture
- [x] Planned enhanced start_development tool schema
- [x] Designed database schema changes
- [x] Defined implementation phases (4 phases)
- [x] Identified all required file changes
- [x] Designed workflow selection and validation logic

### Technical Design

#### WorkflowManager Class
```typescript
class WorkflowManager {
  private predefinedWorkflows: Map<string, YamlStateMachine>
  
  constructor() {
    this.loadPredefinedWorkflows()
  }
  
  getAvailableWorkflows(): WorkflowInfo[]
  getWorkflow(name: string): YamlStateMachine
  loadPredefinedWorkflows(): void
}
```

#### Enhanced start_development Tool Schema
```typescript
{
  workflow: {
    type: 'string',
    enum: ['waterfall', 'epcc', 'bugfix', 'custom'],
    description: 'Choose development workflow...',
    default: 'waterfall'
  }
}
```

### Implementation Phases

#### Phase 1: Core Infrastructure
1. **Create WorkflowManager class** in `src/workflow-manager.ts`
2. **Update StateMachineLoader** to support predefined workflows
3. **Add workflow discovery logic** to scan resources/workflows/
4. **Create workflow validation** for predefined workflows

#### Phase 2: Tool Enhancement
1. **Update start_development tool** in `src/server.ts`
2. **Add workflow parameter** with proper validation
3. **Include detailed workflow descriptions** in tool schema
4. **Update handleStartDevelopment method** to use selected workflow

#### Phase 3: Database Integration
1. **Update database schema** with workflow_name column
2. **Create migration script** for existing conversations
3. **Update ConversationManager** to store/retrieve workflow selection
4. **Ensure conversation continuity** with selected workflow

#### Phase 4: Integration & Testing
1. **Update TransitionEngine** to use workflow from conversation state
2. **Add comprehensive tests** for all three workflows
3. **Update documentation** and system prompts
4. **Validate backward compatibility** with existing custom workflows

### File Changes Required

#### New Files
- `src/workflow-manager.ts` - Core workflow management
- `src/migrations/add-workflow-name.ts` - Database migration
- `test/workflow-manager.test.ts` - Tests for workflow management

#### Modified Files
- `src/server.ts` - Enhanced start_development tool
- `src/database.ts` - Schema updates and migration
- `src/conversation-manager.ts` - Workflow selection storage
- `src/transition-engine.ts` - Use selected workflow
- `src/state-machine-loader.ts` - Support predefined workflows
- `SYSTEM_PROMPT.md` - Updated documentation

### Workflow Selection Logic

#### Priority Order
1. **User-selected workflow** via start_development parameter
2. **Custom workflow** from .vibe/state-machine.yaml (if exists)
3. **Default to waterfall** workflow

#### Validation Rules
- **Predefined workflows** must exist in resources/workflows/
- **Custom workflows** must pass existing validation
- **Workflow selection** is stored per conversation
- **Workflow changes** require new conversation (reset_development)

## Code

*Implementation phase - writing and building the solution*

### Implementation Progress

#### Phase 1: Core Infrastructure ✅
- [x] Create WorkflowManager class
- [x] Update StateMachineLoader for predefined workflows
- [x] Add workflow discovery logic
- [x] Create workflow validation

#### Phase 2: Tool Enhancement ✅
- [x] Update start_development tool in server.ts
- [x] Add workflow parameter with validation
- [x] Include workflow descriptions in tool schema
- [x] Update handleStartDevelopment method

#### Phase 3: Database Integration ✅
- [x] Update database schema with workflow_name column
- [x] Create migration script
- [x] Update ConversationManager for workflow selection
- [x] Ensure conversation continuity

#### Phase 4: Integration & Testing
- [x] Fix database migration issue with interaction_logs table
- [x] Update TransitionEngine to use selected workflow
- [x] Set waterfall as default state machine
- [x] Suppress MCP log error messages during testing
- [x] Fix custom state machine loading in ConversationManager
- [x] Update handleExplicitTransition to use workflow-aware state machine
- [ ] Fix remaining custom state machine test issues
- [ ] Add comprehensive tests
- [ ] Update documentation
- [ ] Validate backward compatibility

### Completed
- [x] Fixed database migration issue - tables are now created in correct order
- [x] Updated TransitionEngine constructor to not load state machine prematurely
- [x] Set waterfall workflow as default state machine in StateMachineLoader
- [x] Updated unit test to expect waterfall.yaml as default path
- [x] Verified database functionality with reset tests passing

## Commit

*Finalization phase - committing changes and documentation*

### Tasks
- [ ] *To be added after previous phases completion*

### Completed
*None yet*

## Decision Log

### Technical Decisions
*Technical decisions will be documented here as they are made*

### Design Decisions
*Design decisions will be documented here as they are made*

## Notes

*Additional notes and observations will be added here throughout development*

---

*This plan is continuously updated by the LLM as development progresses. Each phase's tasks and completed items are maintained to track progress and provide context for future development sessions.*
