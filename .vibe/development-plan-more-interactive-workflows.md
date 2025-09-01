# Development Plan: responsible-vibe (more-interactive-workflows branch)

*Generated on 2025-09-01 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Analyze existing workflows in responsible-vibe-mcp and propose modifications to make them more interactive by adding user queries for contextual information.

## Explore
### Tasks
- [x] Examine existing workflow definitions in resources/workflows/
- [x] Analyze current interaction patterns in each workflow
- [x] Identify gaps in user context gathering
- [x] Document specific opportunities for interactivity improvements
- [x] Analyze workflow instructions for missing user queries
- [x] Analyze each workflow's specific intent/scope vs current instructions
- [x] Identify which workflows would actually benefit from more questions
- [x] Distinguish between software vs non-software workflows

### Completed
- [x] Created development plan file
- [x] User reworked the workflow enhancements with improved formatting and structure
- [x] All workflow modifications successfully implemented and tested
- [x] Enhanced workflows provide meaningful interactive questions that change AI behavior
- [x] Natural language flow maintained with bullet point examples

## Plan

### Phase Entrance Criteria:
- [x] All existing workflows have been analyzed and documented
- [x] Current interaction patterns have been identified
- [x] Gaps in user context gathering have been documented
- [x] User needs for contextual information have been understood

### Tasks
- [x] Design interactive enhancement approach for high priority workflows
- [x] Create specific question templates for each workflow phase
- [x] Design implementation strategy for workflow modifications
- [x] Plan testing approach for enhanced workflows
- [x] Document enhancement specifications
- [x] Analyze later phases in workflows for meaningful questions
- [x] Revise approach to use natural language flow instead of templates
- [x] Identify questions for design, implementation, and verification phases

**Interactive Enhancement Approach:**

**HIGH PRIORITY WORKFLOWS:**

**1. Waterfall Requirements Phase**
- **Current**: "Ask clarifying questions about WHAT they need"
- **Enhancement**: Add structured requirement elicitation framework
- **Questions to Add**:
  - Stakeholder identification: "Who are the key stakeholders? (end users, business owners, technical teams)"
  - Requirement prioritization: "Which requirements are must-have vs nice-to-have?"
  - Success criteria: "How will you measure success? What are the acceptance criteria?"
  - Constraints: "What are your time, budget, technical, or regulatory constraints?"
  - Integration needs: "What existing systems must this integrate with?"

**2. Greenfield Ideation Phase**
- **Current**: "Ask extensive questions to understand WHAT, WHO, WHY"
- **Enhancement**: Add systematic discovery framework
- **Questions to Add**:
  - Market context: "Are there existing solutions? What gaps do they have?"
  - Technical constraints: "What technologies must/cannot be used? Why?"
  - Team context: "What's your team size and skill level?"
  - Success metrics: "How will you measure product success?"
  - User research: "Have you validated this need with potential users?"

**3. Bugfix Reproduce Phase**
- **Current**: "Gather information about conditions, environment, steps"
- **Enhancement**: Add systematic environment documentation checklist
- **Questions to Add**:
  - Environment details: "OS, browser/runtime versions, hardware specs?"
  - Reproduction steps: "Exact sequence of actions that trigger the bug?"
  - Error details: "Error messages, logs, stack traces?"
  - Frequency: "Does this happen every time or intermittently?"
  - Impact assessment: "How many users affected? Business impact?"

**4. EPCC Explore Phase**
- **Current**: "Research codebase, understand existing patterns"
- **Enhancement**: Add structured codebase analysis framework
- **Questions to Add**:
  - Architecture patterns: "What architectural patterns are used? (MVC, microservices, etc.)"
  - Technology stack: "What frameworks, libraries, databases are in use?"
  - Code organization: "How is the code structured? What are the main modules?"
  - Testing approach: "What testing strategies are currently used?"
  - Development practices: "What are the coding standards, CI/CD processes?"

**MEDIUM PRIORITY WORKFLOWS:**

**5. C4-Analysis Discovery Phase**
- **Current**: Has some structure but generic
- **Enhancement**: Add systematic legacy system assessment
- **Questions to Add**:
  - Documentation state: "What documentation exists? How current is it?"
  - Key stakeholders: "Who knows this system best? Who depends on it?"
  - Pain points: "What are the main problems with the current system?"
  - Modernization goals: "What's driving the need to understand this system?"

**6. Big-Bang-Conversion Planning Phase**
- **Current**: Generic conversion planning
- **Enhancement**: Add structured migration assessment
- **Questions to Add**:
  - Migration scope: "What exactly needs to be converted? (data, logic, interfaces)"
  - Risk tolerance: "What's acceptable downtime? Rollback strategy?"
  - Resource constraints: "Timeline, team size, budget limitations?"
  - Validation approach: "How will you verify the conversion worked correctly?"
  - Dependency mapping: "What systems depend on this? What does it depend on?"

**7. Boundary-Testing Architecture Analysis**
- **Current**: Generic architecture analysis
- **Enhancement**: Add systematic boundary identification
- **Questions to Add**:
  - System boundaries: "What are the main system interfaces? (APIs, databases, files)"
  - Business boundaries: "What are the key business processes/domains?"
  - Testing goals: "Compliance requirements? Performance validation? Regression prevention?"
  - Existing tests: "What testing already exists? What gaps need filling?"
  - Test environment: "Where will tests run? What test data is available?"

**IMPLEMENTATION STRATEGY:**

**Revised Approach**: Integrate questions naturally into existing instruction flow using bullet points

**EXPANDED ANALYSIS - LATER PHASES NEEDING QUESTIONS:**

**Waterfall Design Phase**:
- Current: "asking about architecture, technologies, data models, API design, and quality goals"
- **Missing Context**: 
  - Performance requirements: "What are your performance expectations? (response times, throughput, concurrent users)"
  - Technology constraints: "Are there technology preferences or restrictions from your organization?"
  - Integration complexity: "How complex are the integrations with existing systems?"

**Waterfall Implementation Phase**:
- Current: "Focus on code structure, error handling, security, and maintainability"
- **Missing Context**:
  - Implementation approach: "Should this be implemented incrementally or all at once? Any specific order of implementation?"
  - Risk mitigation: "Are there high-risk parts that need extra validation or careful implementation?"

**Bugfix Fix Phase**:
- Current: "Make targeted changes that address the root cause"
- **Missing Context**:
  - Risk assessment: "How critical is this system? What's the blast radius if the fix causes issues?"
  - Fix scope: "Should this be a minimal fix or a more comprehensive solution?"

**Bugfix Verify Phase**:
- Current: "Test the fix thoroughly to ensure the original bug is resolved"
- **Missing Context**:
  - Success criteria: "What specific behavior changes will confirm the fix worked?"
  - Regression scope: "What functionality should be tested to ensure no regressions?"

**Natural Language Integration Pattern**:
Instead of structured templates, integrate questions as bullet points within existing instruction flow:

"You are in the [phase] phase. [Existing instructions]. To ensure you have the right context:
• [Question 1]
• [Question 2] 
• [Question 3]

Based on their responses, [guidance]. [Rest of existing instructions]."

**File Modifications Needed**:
- `/resources/workflows/waterfall.yaml` - requirements phase
- `/resources/workflows/greenfield.yaml` - ideation phase  
- `/resources/workflows/bugfix.yaml` - reproduce phase
- `/resources/workflows/epcc.yaml` - explore phase
- `/resources/workflows/c4-analysis.yaml` - discovery phase
- `/resources/workflows/big-bang-conversion.yaml` - conversion_planning phase
- `/resources/workflows/boundary-testing.yaml` - architecture_analysis phase
```

**TESTING APPROACH:**

**Validation Method**:
1. **Syntax Validation**: Ensure YAML files remain valid after modifications
2. **Workflow Loading**: Test that modified workflows load correctly in the system
3. **Instruction Rendering**: Verify enhanced instructions display properly to AI agents
4. **Behavioral Testing**: Test with sample scenarios to ensure questions are asked appropriately

**Test Cases**:
- Load each modified workflow and verify no parsing errors
- Start each workflow and confirm enhanced instructions are provided
- Test workflow transitions still work correctly
- Verify existing functionality remains intact

**IMPLEMENTATION SPECIFICATIONS:**

**Priority Order**:
1. **waterfall.yaml** - requirements phase (most commonly used)
2. **epcc.yaml** - explore phase (popular for medium features)
3. **bugfix.yaml** - reproduce phase (critical for debugging)
4. **greenfield.yaml** - ideation phase (important for new projects)
5. **c4-analysis.yaml** - discovery phase (specialized but valuable)
6. **big-bang-conversion.yaml** - planning phase (complex migrations)
7. **boundary-testing.yaml** - architecture analysis (testing focus)

**Success Criteria**:
- Each enhanced workflow asks specific, relevant questions before proceeding
- Questions are contextually appropriate to the workflow's purpose
- Enhanced instructions maintain existing workflow functionality
- AI agents receive clear, actionable guidance for user interaction
```

### Completed
*None yet*

## Code

### Phase Entrance Criteria:
- [x] Detailed plan for workflow modifications has been created
- [x] Specific interactive elements have been designed
- [x] Implementation approach has been defined
- [x] User has approved the proposed changes

### Tasks
- [x] Enhance waterfall.yaml requirements phase with stakeholder/constraint questions
- [x] Enhance epcc.yaml explore phase with codebase analysis questions
- [x] Enhance bugfix.yaml reproduce phase with environment checklist questions
- [x] Enhance greenfield.yaml ideation phase with market/context questions
- [x] Enhance waterfall.yaml design phase with performance/constraint questions
- [x] Enhance waterfall.yaml implementation phase with strategy/risk questions
- [x] Enhance bugfix.yaml fix phase with risk/scope questions
- [x] Test all modified workflows load correctly

### Completed
*None yet*

## Commit

### Phase Entrance Criteria:
- [x] All workflow modifications have been implemented
- [x] Interactive elements are working correctly
- [x] Documentation has been updated
- [x] Changes have been tested

### Tasks
- [x] Run final tests to ensure no regressions
- [x] Clean up any development artifacts
- [x] Update plan file with final status
- [x] Verify all enhanced workflows load correctly

### Completed
*None yet*

## Key Decisions
- **Workflow Analysis Scope**: Analyzed 10 existing workflows (waterfall, epcc, bugfix, greenfield, minor, c4-analysis, big-bang-conversion, boundary-testing, slides, posts)
- **Focus Areas**: Identified that workflows primarily provide generic instructions without gathering user-specific context about their environment, preferences, constraints, or existing knowledge
- **Enhancement Scope**: Focus on high/medium priority workflows with meaningful context questions that actually change AI approach
- **Implementation Style**: Natural language flow with bullet points, not structured templates
- **Question Criteria**: Only include questions that change how AI approaches the task, not administrative overhead

## Notes
### Current Workflow Analysis Findings:

**Examined Workflows:**
1. **waterfall** - Requirements → Design → Implementation → QA → Testing
2. **epcc** - Explore → Plan → Code → Commit  
3. **bugfix** - Reproduce → Analyze → Fix → Verify
4. **greenfield** - Ideation → Architecture → Plan → Code → Document
5. **minor** - Explore → Implement
6. **c4-analysis** - Discovery → Context → Container → Component → Code
7. **big-bang-conversion** - Complex conversion workflow
8. **boundary-testing** - API/boundary testing workflow
9. **slides** - Presentation creation workflow
10. **posts** - Content creation workflow

**Current Interaction Patterns:**
- Workflows provide generic instructions like "Ask the user clarifying questions"
- Instructions are broad: "understand their goals, scope, constraints"
- No specific prompts for contextual information
- Missing structured queries about user's environment, experience level, preferences
- No discovery of existing knowledge or constraints

**Identified Gaps in User Context Gathering:**

1. **Environment & Setup Context**
   - No queries about existing codebase structure/patterns
   - Missing questions about development environment, tools, CI/CD
   - No discovery of team size, collaboration needs
   - Missing constraints (time, budget, resources)

2. **User Experience & Preferences**
   - No assessment of user's technical skill level
   - Missing questions about preferred technologies/frameworks
   - No discovery of past experiences with similar projects
   - Missing learning goals or knowledge transfer needs

3. **Project Context**
   - No structured discovery of stakeholders and their needs
   - Missing questions about existing systems/integrations
   - No assessment of performance/scalability requirements
   - Missing discovery of compliance/security requirements

4. **Workflow-Specific Context**
   - **Requirements phase**: Generic "ask clarifying questions" vs specific requirement elicitation techniques
   - **Design phase**: "Ask about architecture" vs structured architecture decision records
   - **Implementation**: No discovery of coding standards, testing practices
   - **Bugfix**: No systematic environment/reproduction context gathering

**Specific Improvement Opportunities:**

1. **Add Context Discovery Phase**
   - Create initial "context" phase for workflows that need it
   - Structured questionnaires for environment, preferences, constraints
   - User skill assessment and learning goals
   - Existing system/codebase analysis

2. **Enhanced Phase Instructions**
   - Replace generic "ask questions" with specific question templates
   - Add structured decision-making frameworks
   - Include context-aware guidance based on discovered information
   - Provide alternative approaches based on user experience level

3. **Workflow-Specific Enhancements**
   - **Waterfall Requirements**: Add stakeholder mapping, requirement prioritization
   - **Greenfield Ideation**: Add market research, competitive analysis prompts
   - **Bugfix Reproduce**: Add systematic environment documentation
   - **EPCC Explore**: Add codebase pattern analysis, existing solution discovery

4. **Dynamic Instruction Adaptation**
   - Modify instructions based on discovered context
   - Provide beginner vs expert guidance paths
   - Adapt complexity based on project size/constraints
   - Include relevant examples based on technology stack

**Workflow-by-Workflow Analysis:**

**NON-SOFTWARE WORKFLOWS (Already Interactive):**
- **posts**: Already has detailed interactive instructions asking about format, audience, goals, competitive landscape
- **slides**: Already asks about audience, goals, timing, context - well structured

**SOFTWARE WORKFLOWS NEEDING ENHANCEMENT:**

**High Priority (Generic Instructions):**
- **waterfall requirements**: "Ask clarifying questions about WHAT they need" - needs structured requirement elicitation
- **greenfield ideation**: "Ask extensive questions" - needs specific stakeholder/market analysis prompts  
- **bugfix reproduce**: "Gather information about conditions, environment" - needs systematic environment checklist
- **epcc explore**: "Research codebase, understand patterns" - needs structured codebase analysis framework

**Medium Priority (Some Structure, Could Improve):**
- **c4-analysis discovery**: Has some structure but could add systematic legacy system assessment questions
- **big-bang-conversion planning**: Complex workflow that could benefit from structured migration assessment
- **boundary-testing architecture**: Could add systematic boundary identification questions

**Low Priority (Already Focused):**
- **minor explore**: Appropriately lightweight for minor changes
- **waterfall design/implementation**: Reasonably specific for their scope

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
