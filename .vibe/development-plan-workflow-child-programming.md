# Development Plan: responsible-vibe (workflow-child-programming branch)

*Generated on 2025-11-23 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Create educational workflow(s) for introducing children to agentic software engineering through game development. The workflow must emphasize learning and understanding over pure code generation, include explanation and knowledge-test phases, and help children scope down ambitious ideas to achievable minimal features.

## Explore
### Tasks
- [ ] Create child-friendly game specification template

### Completed
- [x] Created development plan file
- [x] Research existing educational workflows in the codebase
- [x] Analyze current workflow structure and capabilities
- [x] Analyzed SDD workflows (sdd-feature, sdd-bugfix, sdd-greenfield) - these are ideal for adaptation
- [x] Reviewed existing template system (architecture, design, requirements)
- [x] Define target age group and skill level (8-12, beginners)
- [x] Research pedagogical approaches - explanation during transitions, post-artifact learning
- [x] Clarified scope: three workflows needed (greenfield, enhancement, bugfix)
- [x] Map out sdd-game-beginner workflow phases (based on sdd-greenfield)
- [x] Identify which phases produce artifacts and need explanation phases
- [x] Define learning objectives for each phase
- [x] Design scope management strategies for game specifications
- [x] Define knowledge-test format - use review_perspectives with quiz-master role!

## Plan

### Phase Entrance Criteria:
- [ ] Target age group and skill level have been defined
- [ ] Existing workflow structures have been analyzed
- [ ] Pedagogical approach for explanations and knowledge tests is clear
- [ ] Scope management strategies are documented
- [ ] Key learning objectives are identified
- [ ] Technical feasibility of implementation is understood

### Implementation Strategy

We will create a comprehensive educational game development workflow for children by:

1. **Creating the workflow file**: `resources/workflows/sdd-game-beginner.yaml`
2. **Creating child-friendly templates**: New template directory and game-specific templates
3. **Leveraging existing infrastructure**: Using review_perspectives and transition instructions

### File Structure
```
resources/
  workflows/
    sdd-game-beginner.yaml          (new - primary workflow)
  templates/
    children/                        (new directory)
      game-spec-beginner.md          (new - game specification template)
      game-plan-beginner.md          (new - simplified planning template)
      game-dev-principles-template.md (new - constitution template)

Project files created during workflow:
  game-dev-principles.md            (created in constitution phase, stored in project root)
```

### Workflow Design Details

**Phase Flow**:
```
constitution → imagine → specify → plan → tasks → implement → explain → play-test → celebrate
```

**Constitution Phase** (NEW - first phase):
- Creates `game-dev-principles.md` file using template
- Child-friendly principles document
- Referenced by LLM reading the file in later phases

**Educational Features**:
- Transition instructions explain what's coming next
- Quiz-master reviews after specify, plan, tasks (optional)
- Explicit explain phase after implement
- Scope management in specify phase
- Child-friendly language throughout

### Tasks
*All planning tasks complete*

### Completed
- [x] Design complete workflow YAML structure with all phases
- [x] Write transition instructions for each phase (child-friendly)
- [x] Design quiz-master prompts for each review point
- [x] Create game specification template for children
- [x] Create simplified game plan template
- [x] Define scope reduction prompts for specify phase
- [x] Map dependencies and edge cases
- [x] Design child-friendly constitution/principles document
- [x] Integrate constitution references into phase instructions
- [x] Add comprehension checks to EVERY phase (crucial pedagogical requirement)

### Dependencies and Edge Cases

**Dependencies**:
- No external dependencies - uses existing workflow infrastructure
- Templates follow existing template structure in `resources/templates/`
- Review perspectives feature already exists in workflow system

**Edge Cases**:
1. **Child wants to build something too complex** 
   - Handled by scope management in specify phase
   - Quiz-master can help reinforce MVP thinking
   
2. **Child doesn't understand technical concepts**
   - All instructions use game metaphors
   - Quiz-master reviews help catch misunderstandings early
   - Explain phase reinforces learning
   
3. **Child gets discouraged**
   - Small wins with user-story-based implementation
   - Celebration moments at each phase
   - Positive, encouraging language throughout
   
4. **Knowledge tests too hard/easy**
   - Quiz-master role is flexible - can adapt difficulty
   - Tests are optional (via review system)
   - Focus on understanding, not correctness

**Success Criteria**:
- Child completes a working game
- Child understands basic game development concepts
- Child feels confident and excited to build more

### Child-Friendly Constitution Design

The constitution will guide all phases and maintain consistency across sessions:

```markdown
# Game Development Principles for Young Developers 🎮

## Our Core Rules for Making Awesome Games

### 1. Start Small, Dream Big
- Every great game started simple! Minecraft was just placing blocks at first.
- Build Version 1 first, then add cool features later
- One feature at a time = more wins to celebrate!

### 2. Learning is the Real Win
- Understanding HOW your game works is more important than perfect code
- Questions are good! Ask when you're confused
- Mistakes help you learn - even professional game devs make bugs!

### 3. Keep It Fun
- If you're not having fun, we're doing it wrong
- Games should be fun to MAKE and fun to PLAY
- Take breaks when you need them

### 4. Simple is Super
- Simpler code is easier to understand and easier to fix
- Don't try to build everything at once
- Three simple features working well > ten complex features half-broken

### 5. Test As You Go
- Play your game often while building it
- If something's broken, fix it before adding more
- Testing is part of the fun!

### 6. Celebrate Progress
- Finished a feature? That's awesome! 🎉
- Every small step forward counts
- You're a real game developer!
```

**How it's used**:
- Phase instructions reference these principles
- Example in specify phase: "Remember our principle: Start Small, Dream Big! Let's build Version 1 first..."
- Keeps child focused on learning and appropriate scope across sessions

### Detailed Workflow Design

**Constitution/Principles**: 
- **First phase creates the document**: `constitution` phase generates `game-dev-principles.md` in project root
- **Later phases READ the file**: Instructions explicitly say "Read the game development principles (`game-dev-principles.md`)"
- **Compliance checks**: "Evaluate approach against principles in game-dev-principles.md"
- This matches SDD pattern - actual file I/O, not just inline reminders

#### Phase: constitution
**Purpose**: Create game development principles document for consistency
**Instructions**:
```
You are establishing the game development principles for this young developer! 
This document will guide all decisions throughout building the game.

Create a `game-dev-principles.md` file in the project root using the template.
Use friendly, encouraging language that an 8-12 year old can understand.
These principles will help keep the project on track across multiple sessions!

**IMPORTANT - Before transitioning**:
After creating the principles document, explain what it is:
"I just created your Game Developer Rules! These are simple guidelines that will help us 
build your game the right way. Let me read them to you..."

Then read the principles aloud (summarize each one briefly).

Finally, ask: "Do you understand these rules? Do you have any questions about them 
before we start dreaming up your game idea?"

WAIT for the child's response. Answer any questions. Only proceed when they say they're ready.
```
**Template provided in additional_instructions** (6 core principles)
**Transitions**:
- To imagine: (only after child confirms understanding)

#### Phase: imagine
**Purpose**: Dream phase - let kids describe their game idea
**Instructions**:
```
Welcome to game building! 🎮 Tell me about the game you want to create!
What kind of game is it? What do players do? What makes it fun?
Don't worry about how hard it is - just dream big! We'll figure out how to build it together.

**IMPORTANT - Before transitioning**:
After discussing their game idea, summarize what you heard:
"So you want to build a game where [summarize their idea]. That sounds AWESOME!"

Then ask: "Did I understand your idea correctly? Is there anything else you want to tell me 
about your game before we write it down in a design document?"

WAIT for the child's response. Clarify if needed. Only proceed when they confirm you got it right.
```
**Transitions**:
- To specify: "Awesome game idea! Now let's write down your game plan in a special document 
  called a Game Design Specification. This is like a map that shows what we're going to build! 🗺️" 
  (only after child confirms understanding)

#### Phase: specify
**Purpose**: Create game specification with built-in scope management
**Instructions**: 
```
Create the game specification using the child-friendly template.

**Load Context**:
- Read the game development principles (`game-dev-principles.md`)
- Keep Principle #1 in mind: "Start Small, Dream Big"

SCOPE MANAGEMENT (following the principles):
- If the game idea is very complex (like "Minecraft" or "Fortnite"), guide them to MVP
- Ask: "What's the ONE most fun thing in your game? Let's build that first!"
- Use examples: "Minecraft started as just placing blocks! Angry Birds started with just one bird type!"
- Template has "Version 1 (Let's Build This!)" and "Cool Ideas for Later" sections

Follow Principle #4: "Simple is Super" - simpler features are easier to build and more fun to finish!

Use simple language, game metaphors (sprites, enemies, power-ups, not classes/objects).

**IMPORTANT - Before transitioning**:
After creating the specification, review it with the child:
"I just wrote down your game design! Let me explain what we're going to build..."
[Summarize the Version 1 features in simple terms]

Then ask: "Does this sound right? Do you understand what features we're building first? 
Any questions about the game plan before we figure out HOW to build it?"

WAIT for the child's response. Adjust the spec if needed. Only proceed when they understand and agree.
```
**Transitions**:
- To plan: (only after comprehension check)
- Review (optional quiz-master): [existing quiz-master content]
**Transitions**:
- To plan: "Great job on your game design! 🎨 Now we need to create a BUILD PLAN - like instructions for building with LEGO! We'll figure out what code pieces we need and how they fit together."
- Review (optional quiz-master):
  ```
  You're a friendly quiz master helping a child learn game design! 
  Ask 2-3 simple, fun questions about their game:
  - "What's the main goal of your game?"
  - "Who or what is the player controlling?"
  - "What's the first thing a player will see when they start?"
  
  Be super encouraging! Praise their creativity! Use emojis! 🎮✨
  If they seem unsure, help them think through it with hints.
  ```

#### Phase: plan  
**Purpose**: Create simplified implementation plan with game metaphors
**Instructions**:
```
Create a simplified build plan using the child-friendly template.

**Load Context**:
- Read the game specification
- Read the game development principles (`game-dev-principles.md`)

Focus on:
- What are the main "pieces" (classes/components) we need?
- Use game metaphors: "Game Manager" (like a referee), "Player Controller" (character's brain)
- Keep it simple - avoid overwhelming technical details (follow Principle #4: "Simple is Super")
- Show how pieces connect to make the game work

If technology choices are needed, prefer simpler options (Python/Pygame, JavaScript/HTML5 Canvas, Scratch-like).

**Principles Compliance Check**:
- Does this plan follow "Start Small, Dream Big"?
- Is it simple enough for a beginner? (Principle #4)
- Can we test as we go? (Principle #5)

**IMPORTANT - Before transitioning**:
After creating the build plan, explain it to the child:
"I just made a plan for HOW we'll build your game! Here are the main pieces we need..."
[Explain 3-4 main components using game metaphors]

Then ask: "Does that make sense? Can you see how these pieces will work together to make your game? 
Any questions before we break this into small steps?"

WAIT for the child's response. Clarify concepts if needed. Only proceed when they understand.
```
**Transitions**:
- To tasks: (only after comprehension check)
- Review (optional quiz-master): [existing quiz-master content]

#### Phase: tasks
**Purpose**: Break down into small, achievable tasks
**Instructions**:
```
Create a child-friendly task list organized by game features (user stories).

- Use simple task descriptions: "Make the player character" not "Implement Player class with inheritance"
- Show which tasks can be done in parallel [P]
- Organize by "must have" features first
- Keep tasks small for quick wins and motivation

**IMPORTANT - Before transitioning**:
After creating the task list, review it with the child:
"Great! I broke down building your game into small steps. Here's what we'll do..."
[Highlight the first 3-4 tasks they'll work on]

Then ask: "Do you see how we're breaking this into small pieces? Each task is something we can 
finish and test! Does this make sense? Ready to start coding?"

WAIT for the child's response. Answer questions. Only proceed when they're ready and excited.
```
**Transitions**:
- To implement: (only after comprehension check and child confirms readiness)
- Review (optional quiz-master): [existing quiz-master content]

#### Phase: implement
**Purpose**: Write actual game code with explanations
**Instructions**:
```
Build the game following the task list! 

REMEMBER THE PRINCIPLES:
- "Keep It Fun" - if it stops being fun, take a break!
- "Test As You Go" - play your game often while building
- "Celebrate Progress" - each working feature is a win!

For children:
- Explain what each piece of code does as you write it
- Use comments with simple explanations
- Celebrate each working feature: "The player can move! 🎮"
- Test frequently so they can see progress
- Follow their technology choice from planning

Focus on one user story at a time for quick wins.

**IMPORTANT - Check understanding frequently**:
After completing EACH major feature or task:
"We just built [feature]! Let me show you what it does..."
[Demonstrate or explain the feature]

Ask: "Do you understand how this works? Want to try running it? Any questions before we move to the next part?"

WAIT for response. Let them test/play. Answer questions. This keeps them engaged!
```
**Transitions**:
- To explain: "WOW! You just built a real game! 🌟 Let's look at what you created and understand how it all works together!"
  (only after all implementation complete and final comprehension check)
- Review (quiz-master - recommended): [existing quiz-master content]

#### Phase: explain
**Purpose**: Review and understand what was built (2-3 key parts)
**Transitions**:
- To play-test

#### Phase: play-test
**Purpose**: Test and enjoy the game
**Transitions**:
- To celebrate

#### Phase: celebrate
**Purpose**: Celebrate achievement and reflect
**Transitions**:
- To imagine (for next game/features)

## Code

### Phase Entrance Criteria:
- [x] Workflow structure is designed and documented
- [x] All phases (including explanation and knowledge-test phases) are defined
- [x] Scope management mechanisms are specified
- [x] Learning objectives are mapped to workflow phases
- [x] Implementation approach has been reviewed and approved

### CRITICAL ISSUE IDENTIFIED - RESTARTING APPROACH

**Problem**: Mixed up templates and over-complicated structure
- Based workflow on SDD (Specification-Driven Development) which uses branch-based files
- Created too many templates (game-spec, game-plan, game-dev-principles, game-design, game-architecture)
- SDD approach doesn't fit long-term educational use case
- Children need simpler, more maintainable document structure

**New Approach**: Base on **greenfield workflow** instead
- Use standard project docs: `architecture.md`, `design.md`, `requirements.md` (not requirements for children)
- Greenfield workflow phases: ideation → architecture → plan → code → finalize
- Adapt for children: constitution → imagine → architecture → design → code → celebrate
- Keep constitution phase (game development principles)
- Use proper long-term memory documents that persist across sessions

### Tasks - RESTART (ALL COMPLETE!)
- [x] Review greenfield.yaml workflow structure carefully
- [x] Keep workflow skeleton from game-beginner.yaml (states are good!)
- [x] Delete over-complicated templates: game-spec-beginner.md, game-plan-beginner.md, game-design-beginner.md, game-architecture-beginner.md
- [x] Reorganize game-dev-principles-template.md into proper template structure:
  - [x] Create requirements-beginner.md (game dev principles - tech agnostic)
  - [x] Create architecture-beginner.md (platform + structure - tech specific)
  - [x] Create design-beginner.md (features + implementation)
- [x] Update constitution phase to use setup_project_docs() with children templates
- [x] Update workflow to reference $ARCHITECTURE_DOC and $DESIGN_DOC properly
- [x] Implement incremental review cycle (CRITICAL FOR LEARNING):
  - [x] code phase instructions: transition to review after each major development session
  - [x] review phase instructions: explain major new changes to child
  - [x] review→code transition: quiz-master asks questions about changes (child explores code)
  - [x] code→celebrate transition: when all features complete
- [x] Simplify phase flow: constitution → imagine → architecture → design → code ↔ review → celebrate
- [x] Remove SDD-specific references and branch-based file structures
- [x] Test workflow loads and validates correctly

### Restart Complete! ✅

**Final Structure:**

```
resources/workflows/children/
  ├── game-beginner.yaml           (493 lines) - Workflow state machine
  └── system-prompt-beginner.md    (80 lines) - Tool-focused ⭐

resources/templates/
  ├── requirements/game-requirements.md  (264 lines) - WHAT to build
  ├── architecture/game-architecture.md  (250 lines) - WHO does WHAT ⭐ PURE CONCEPTUAL
  └── design/game-design.md              (322 lines) - HOW with code
```

**Complete Transformation:**

| Component | Initial | Final | Change |
|-----------|---------|-------|--------|
| Workflow | 988 lines | 493 lines | **-50%** |
| System Prompt | 187 lines | 80 lines | **-57%** |
| Architecture | 465 lines (code-heavy) | 250 lines (conceptual) | **-46%** ⭐ |
| Design | 516 lines (mixed) | 322 lines (HOW-focused) | **-38%** |
| Requirements | Flat | 264 lines (progressive) | Restructured |

**Perfect Separation Achieved:**

1. **Requirements** (264 lines)
   - Core Game Principle (ONE sentence)
   - Version 1 → Level 2 → Level 3 (progressive)
   - Scope management
   - Celebration log

2. **Architecture** (250 lines) ⭐ FINAL
   - Platform decision
   - Building blocks (conceptual only)
   - Responsibilities (WHAT each does, WHY needed)
   - Relationships (HOW they connect)
   - ❌ NO code examples
   - ❌ NO file organization
   - ❌ NO implementation details
   - Pure concepts with analogies

3. **Design** (322 lines)
   - Core patterns WITH code
   - Feature implementation guides
   - File organization
   - Build order (concrete tasks)
   - Testing checkpoints

4. **System Prompt** (80 lines)
   - Tool usage (start_development, whats_next)
   - Language detection
   - Tone (4 traits)
   - Communication essentials
   - No redundancy

**Zero Overlap:**
- Requirements = WHAT + WHY
- Architecture = WHO + ROLES (no code!)
- Design = HOW + CODE
- System Prompt = TOOLS + TONE
- Workflow = PHASE INSTRUCTIONS

**What we built:**
- ✅ **3 clean, focused templates** (requirements, architecture, design)
- ✅ **Workflow**: 493 lines (down from 988), clean and focused
- ✅ **System prompt**: 187 lines in separate file for maintainability
- ✅ **System prompt content**:
  - Tone guidelines (enthusiastic, patient, celebratory, supportive)
  - 7 pedagogical principles with practical examples
  - Explicit setup_project_docs() call requirement
  - "Reviews are REQUIRED" statement
  - Concrete DO/DON'T examples for language and questions
  - Documentation reference patterns
- ✅ **Workflow references**: `system_prompt_file: 'children/system-prompt-beginner.md'`
- ✅ **Constitution phase**: Explicitly calls `setup_project_docs()` with child templates
- ✅ **Document references**: $REQUIREMENTS_DOC, $ARCHITECTURE_DOC, $DESIGN_DOC
- ✅ **Incremental review cycle**: code ↔ review pattern with quiz-master
- ✅ **Active learning**: Quiz questions make children explore code
- ✅ **YAML validation**: ✅ Passes all checks
- ✅ **7 states**: constitution → imagine → architecture → design → code ↔ review → celebrate
- ✅ **metadata.requiresDocumentation**: true

### Completed (First Iteration - SDD-based - TOO COMPLEX)
- [x] ~~Create resources/templates/children/ directory~~
- [x] ~~Create game-dev-principles-template.md (constitution template)~~ - KEEPING THIS
- [x] ~~Create game-spec-beginner.md (game specification template)~~ - REMOVING (SDD-specific)
- [x] ~~Create game-plan-beginner.md (simplified planning template)~~ - REMOVING (SDD-specific)
- [x] ~~Create resources/workflows/sdd-game-beginner.yaml~~ - BECAME game-beginner.yaml
- [x] ~~REFACTORING: Create game-design-beginner.md template~~ - REMOVING (too specific)
- [x] ~~REFACTORING: Create game-architecture-beginner.md template~~ - REMOVING (too specific)
- [x] Identified problem: SDD approach too complex, too many templates
- [x] Decision: Restart based on greenfield workflow with proper project docs

## Commit

### Phase Entrance Criteria:
- [ ] Workflow file(s) have been created and tested
- [ ] All phases work as designed
- [ ] Documentation is complete
- [ ] Examples are provided
- [ ] Code quality checks pass

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions

**RESTART DECISION (2025-11-24)**: 
- **Problem**: First iteration based workflow on SDD (Specification-Driven Development) which creates branch-based, project-specific files (spec.md, plan.md, tasks.md). This created too many templates and over-complicated the structure.
- **Solution**: Restart based on **greenfield workflow** which uses long-term project documents ($ARCHITECTURE_DOC, $DESIGN_DOC, $REQUIREMENTS_DOC).
- **What we're keeping**: 
  - Workflow skeleton from game-beginner.yaml (states are reasonable)
  - game-dev-principles-template.md (constitution - this is good!)
  - System prompt with 7 core principles for child interaction
  - Incremental code ↔ review cycle (critical for learning!)
- **What we're removing**:
  - game-spec-beginner.md (SDD-specific)
  - game-plan-beginner.md (SDD-specific)
  - game-design-beginner.md (too specific, merge into design template)
  - game-architecture-beginner.md (too specific, merge into architecture template)
- **New approach**: Use standard template structure with child-friendly content:
  - `templates/children/requirements-beginner.md` - game dev principles (tech-agnostic) - rename from game-dev-principles-template.md
  - `templates/children/architecture-beginner.md` - platform choice + code structure (tech-specific)
  - `templates/children/design-beginner.md` - features + implementation plan
  - Use `setup_project_docs()` in constitution phase to create these in .vibe/docs/
- **Simplified phase flow**: constitution → imagine → architecture → design → code ↔ review → celebrate

**INCREMENTAL REVIEW CYCLE - CRITICAL FOR LEARNING**:
- **Purpose**: Children need frequent breaks to understand and internalize what they built
- **code phase**: LLM instructed to transition to review after each major development session (e.g., after building a complete feature like "player movement" or "enemy spawning")
- **review phase**: LLM explains major new changes to child in simple terms
  - "We just added player movement! Let me show you how it works..."
  - Show specific code changes, explain what they do
  - Demonstrate the new feature working
- **review→code transition**: Quiz-master review asks questions about the changes
  - "Can you find where we check for arrow key presses in the code?"
  - "What happens when the player goes off the screen?"
  - Child EXPLORES the code to find answers (active learning!)
- **Cycle continues**: code → review → code → review → ... until all features complete
- **code→celebrate**: Only when game is fully complete, transition to celebrate
- This prevents overwhelming children with too much code at once and ensures understanding!

1. **Workflow Foundation**: Will adapt SDD (Specification-Driven Development) workflows as the foundation
   - Rationale: SDD workflows separate concerns into distinct phases (specify, plan, implement), making it natural to insert educational elements
   - The specification phase already encourages thinking before coding, perfect for teaching
   - Template-driven approach allows for child-friendly language

2. **Multiple Workflows Needed**: Three separate workflows for different scenarios
   - **game-beginner**: Greenfield - building a new game from scratch (PRIMARY FOCUS)
   - **game-enhance-beginner**: Enhancement - adding features to existing game (future)
   - **game-bugfix-beginner**: Bugfix - fixing problems in existing game (future)
   - All targeting ages 8-12 with beginner-friendly language

3. **Template Strategy**: Will create child-specific templates in the `/resources/templates/` structure
   - Create new directory: `templates/children/` for game-specific templates
   - Use simple language, examples, and visual metaphors
   - Include prompts that guide scope reduction

4. **Pedagogical Approach - FINAL**:
   - **Explanations in Transitions**: Use `additional_instructions` in transitions to explain what's about to happen
   - **Only ONE Explicit Explain Phase**: After `implement` phase only
   - **Explain Phase Purpose**: Review what was built, highlight most important changes in simple words
   - **Knowledge Tests via Reviews**: Use `review_perspectives` with "quiz-master" role to ask questions
   - This is cleaner than separate explain/learn phases everywhere!

5. **Focus**: Start with beginner greenfield workflow first, then expand to others

6. **Phase Structure** (FINAL DESIGN):
   - constitution → imagine → specify → plan → tasks → implement → explain → play-test → celebrate
   - 9 phases total with natural flow
   - Quiz-master reviews optional after specify, plan, tasks, implement phases
   - Clear educational moments without disrupting workflow

7. **Constitution/Principles Document** (CLARIFIED):
   - Like sdd-greenfield: Create a `constitution` phase that generates `game-dev-principles.md` file
   - Store in project root or $VIBE_DIR
   - Later phases explicitly instruct LLM to READ this file
   - Example: In plan phase: "Read the game development principles (`game-dev-principles.md`)"
   - Used for compliance checks: "Evaluate approach against game development principles"
   - This is how SDD maintains consistency - actual file reading, not just inline reminders!

8. **Comprehension Checks - CRUCIAL**:
   - EVERY phase must end with checking if child understood and is ready to proceed
   - Example: "Do you understand what we just did? Do you have any questions before we move on?"
   - Wait for confirmation before transitioning to next phase
   - This is pedagogical best practice - never assume understanding!

9. **Language Support**:
   - Single workflow with language detection in system prompt
   - LLM automatically responds in user's language (German, English, etc.)
   - All documents created in user's language
   - More maintainable than separate workflow files per language

10. **Technology Selection - Child-Centered** (NEW):
    - Ask child WHERE they want to play the game first
    - "On Scratch website? In web browser? On your computer?"
    - Platform choice based on their answer and comfort level
    - Makes technology decision relatable and understandable for children

11. **Frequent Mini-Reviews During Implementation**:
    - New `review` state for mini-reviews during implementation
    - After every 2-3 tasks or major feature (~30-45 mins), transition to review
    - Prevents overwhelming children with too much code at once
    - Keeps engagement high with frequent testing and celebration
    - Review phase: test, celebrate, check understanding, then continue or finish
    - Implements implement ↔ review cycle for incremental learning

12. **Code Quality and Architecture - CRITICAL**:
    - **ALWAYS EXPLAIN code while writing** - BEFORE/WHILE/AFTER pattern enforced
    - **Object-Oriented Programming** - Each game entity is a class (Player, Enemy, Game)
    - **NO Spaghetti Code** - Organized by responsibility, clear separation
    - **State/Mechanics/Presentation separation** - enforced from constitution
    - **Clean code standards**: meaningful names, short functions, helpful comments
    - Examples of good vs. bad code included in implement phase and constitution
    - Teaches proper software architecture while building games

## Notes
### SDD Workflow Insights
- SDD workflows have excellent structure: analyze → specify → clarify → plan → tasks → implement
- Built-in specification templates guide thinking before implementation
- The specification format prevents over-scoping with structured questions
- Review perspectives feature perfect for educational knowledge testing

### Pedagogical Approach - FINAL DESIGN

**1. Explanations in Transition Instructions**
- Use `additional_instructions` field when transitioning TO each phase
- Example transition to specify: "Great job! Now we're going to write down your game idea in a special game design document. This will be your blueprint - like a map for building your game! 🎮"
- No separate explain phases (except after implement)

**2. Single Explicit Explain Phase (after implement only)**
- After code is written, transition to dedicated `explain` phase
- Instructions: "Review the code that was created. Explain in simple words what the most important parts do. Use analogies kids understand (like game mechanics). Highlight 2-3 key changes."
- Example: "We created a Player class - that's like your game character's brain! It remembers your score and position."

**3. Knowledge Testing via Review Perspectives**
- Use `review_perspectives` with role: "quiz-master"
- Triggered when transitioning OUT of implement phase
- Quiz-master prompt: "Ask 3 simple questions to check if the child understands what was built. Make it fun and encouraging! Focus on concepts, not syntax. Examples: 'What does the Player remember?', 'Why do we need a Game Loop?'"
- Makes reviews optional and playful

### Proposed Beginner Workflow Structure (REVISED)
```
sdd-game-beginner:
  imagine          
    ↓ (additional_instructions: "Now let's write your game idea down...")
  specify          (creates spec.md with scope guards)
    ↓ (additional_instructions: "Now we'll figure out HOW to build it...")
    ↓ (optional review with quiz-master: basic game design questions)
  plan             (creates plan.md - simplified)
    ↓ (additional_instructions: "Let's break this into small steps...")
    ↓ (optional review with quiz-master: architecture understanding)
  tasks            (creates tasks.md - child-friendly)
    ↓ (additional_instructions: "Time to build! Let's code together...")
  implement        (write code, one user story at a time)
    ↓ (review with quiz-master: test understanding of code)
  explain          (EXPLICIT PHASE - review what was built)
    ↓ (additional_instructions: "Let's test your game!")
  play-test        (test the game!)
    ↓
  celebrate        (celebrate the achievement! 🎉)
```

### Key Workflow Features

**Transition Instructions Example**:
```yaml
transitions:
  - trigger: 'specification_complete'
    to: 'plan'
    additional_instructions: |
      Awesome work on your game design! 🎮 
      
      Now we're going to create a BUILD PLAN - like instructions for building with LEGO! 
      We'll figure out what pieces (code) we need and how they fit together.
    review_perspectives:
      - perspective: 'quiz-master'
        prompt: |
          You're a friendly quiz master! Ask the child 2-3 simple questions about their game design:
          - What is the main goal of their game?
          - Who is the player character?
          - What's the first thing a player will do?
          Keep it fun and encouraging! Praise their answers!
```

**Explain Phase Instructions**:
```yaml
explain:
  description: 'Review and understand what was built'
  default_instructions: |
    You are helping a child understand the code they just created! 
    
    Review the most important code files and explain in SIMPLE words:
    - What are the 2-3 most important parts?
    - Use game analogies (like: "This is your game's brain", "This is like a scorekeeper")
    - Point out cool things they built
    - Keep it short and exciting!
    
    Example: "You created a Player class! That's like your character's memory - 
    it remembers your score and where you are on the screen! 🌟"
```

### Scope Management Strategy
- In "specify" phase default_instructions:
  - "That's an AMAZING idea! Games are built in versions. Minecraft started with just placing blocks!"
  - "Let's pick the ONE most fun thing to build first. We can add more later!"
  - Template has "Version 1 (Let's Build This!)" and "Future Awesome Ideas" sections

### Benefits of This Approach
✅ Cleaner workflow (fewer phases)
✅ Reviews are optional (not blocking)
✅ Explanations naturally flow with transitions
✅ Single focused explain phase after implementation
✅ Quiz-master makes testing playful
✅ Leverages existing review_perspectives feature

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
