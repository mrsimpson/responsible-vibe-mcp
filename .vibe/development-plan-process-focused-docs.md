# Development Plan: responsible-vibe (process-focused-docs branch)

*Generated on 2025-10-02 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Completely revamp the documentation that has grown historically and doesn't help new users get started quickly

## Explore
### Tasks
- [x] Analyze current documentation structure and identify pain points
- [x] Map the new user journey and identify key friction points
- [x] Research documentation best practices for developer tools
- [x] Identify content gaps and redundancies in current docs
- [x] Analyze user feedback and common support questions
- [x] Study successful documentation examples from similar tools
- [x] **CRITICAL GAP**: Investigate advanced software engineering practices with responsible-vibe
- [x] Analyze setup_project_docs and long-term memory integration
- [x] Document workflow variables and their usage patterns
- [x] Explore trunk-based development with feature branches
- [x] Understand rule files integration (HOW of deliverables vs HOW of process)

### Completed
- [x] Created development plan file
- [x] Examined current project structure and documentation layout
- [x] Identified main documentation areas: README, docs/, VitePress setup
- [x] **Pain Point Analysis**: Found major issues with cognitive overload, setup friction, and mixed audiences
- [x] **Content Audit**: Discovered significant duplication between README.md and docs/README.md
- [x] **User Journey Mapping**: Identified 4-step process that overwhelms new users upfront
- [x] **Best Practices Research**: Studied patterns from Stripe, Vercel, and other dev tools
- [x] **User Feedback Analysis**: Inferred from current setup complexity and support burden

## Plan
### Phase Entrance Criteria:
- [x] Current documentation structure and pain points have been thoroughly analyzed
- [x] User journey and needs have been identified and documented
- [x] Content audit has been completed with gaps and redundancies identified
- [x] New documentation structure and approach has been researched

### Tasks
- [x] Design new information architecture with progressive disclosure
- [x] Create content strategy for different user personas (beginner, intermediate, advanced)
- [x] Plan new README.md structure focused on quick wins
- [x] Design VitePress site restructure with clear user paths
- [x] Plan advanced engineering practices documentation section
- [x] Define content migration and creation strategy
- [x] Plan validation approach with real user scenarios
- [x] **REVISION**: Address user feedback on universal agent support, multiple workflows, and "How it works"

### Completed
- [x] **Complete Documentation Strategy Designed**: New information architecture with progressive disclosure
- [x] **Persona-Based Content Strategy**: Beginner → Intermediate → Advanced user paths
- [x] **New README Structure**: 2KB focused version replacing 7.3KB overwhelming version  
- [x] **VitePress Site Restructure**: Clear navigation with Getting Started → User Guides → Reference → Examples
- [x] **Advanced Engineering Section**: Comprehensive plan for setup_project_docs, workflow variables, trunk-based development, rule files integration
- [x] **5-Phase Implementation Plan**: Detailed migration and creation strategy
- [x] **Validation Framework**: Success metrics and testing approach defined

## Code
### Phase Entrance Criteria:
- [x] New documentation structure and content strategy has been defined
- [x] Content migration and creation plan has been established
- [x] Technical implementation approach has been decided
- [x] Success metrics and validation criteria have been defined

### Tasks
- [x] **Phase 1: New README.md**
  - [x] Replace current README.md with revised 2KB version emphasizing universal MCP support
  - [x] Highlight multiple battle-tested workflows (not single linear process)
  - [x] Include universal MCP compatibility + preconfigured agents
- [x] **Phase 2: VitePress Landing & Getting Started**
  - [x] Create new landing page with value prop, differentiation, and universal MCP setup
  - [x] Restructure sidebar: Getting Started (4) → User Guides (3) → Interactive Workflows (1) → Development (4)
  - [x] Create "What is Responsible Vibe?" with clear differentiation (integrated in landing page)
  - [x] Create detailed "How It Works" section (mechanics + vs other agentic tools)
  - [x] Create "Hands-On Tutorial" (greenfield → enhancement → bugfix)
  - [x] Update VitePress config with new navigation structure
- [ ] **Phase 3: Content Migration & Workflow Focus**
  - [ ] Create "Automatic Workflow Selection" guide (AI picks + manual override + link to /workflows)
  - [ ] Create "Hands-On Tutorial": 
    - [ ] Step 1: Greenfield workflow (todo-app/dice game, terminal UI)
    - [ ] Step 2: Enhancement with EPCC (high-score tracking)
    - [ ] Step 3: Bugfix workflow (find/create bug, let AI fix)
  - [ ] Migrate existing user guide content to new structure
  - [ ] Ensure /workflows route (workflow-visualizer) is properly integrated
  - [ ] Update VitePress config with new navigation structure
- [ ] **Phase 4: Advanced Engineering Practices (NEW)**
  - [ ] Create project-documentation.md (setup_project_docs guide)
  - [ ] Create workflow-variables.md ($ARCHITECTURE_DOC, etc.)
  - [ ] Create trunk-based-development.md (branch-specific plans)
  - [ ] Create rule-files-integration.md (process vs deliverable guidance)
  - [ ] Create long-term-memory.md (.vibe/docs structure)
- [ ] **Phase 5: Validation**
  - [ ] Test documentation with user scenarios focusing on workflow selection
  - [ ] Validate universal MCP setup instructions
  - [ ] Validate success metrics (time to first success, completion rate)

### Completed
*None yet*

## Commit
### Phase Entrance Criteria:
- [ ] All new documentation has been created and migrated
- [ ] Documentation has been tested with target user scenarios
- [ ] Old documentation has been properly archived or removed
- [ ] New user onboarding flow has been validated

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
- **Current State Analysis**: Documentation is spread across README.md (project root), docs/ folder with VitePress, and various scattered files
- **Main Pain Points Identified**: 
  - Complex setup process requiring system prompt configuration
  - Multiple entry points (README vs docs site) creating confusion
  - Technical implementation details mixed with user guidance
  - No clear progressive disclosure for different user types (beginners vs advanced)
- **CRITICAL DISCOVERY**: Missing advanced engineering practices documentation is a major gap
- **USER FEEDBACK INTEGRATION**: 
  - ✅ Universal MCP agent support (not just preconfigured ones)
  - ✅ Multiple battle-tested workflows (not single linear process)
  - ✅ Detailed "How it works" + differentiation from other tools
  - ✅ Simplified structure (removed unclear Reference/Examples sections)
- **REVISED INFORMATION ARCHITECTURE**:
  ```
  README.md (Project Root) - 30-second value prop + instant setup
  ├── Quick Start (2 minutes to first success)
  └── Link to full documentation site
  
  Documentation Site (docs/)
  ├── Getting Started
  │   ├── What is Responsible Vibe? (value proposition + differentiation)
  │   ├── How It Works (detailed mechanics + vs other tools)
  │   ├── Quick Setup (universal MCP + preconfigured agents)
  │   └── First Feature (guided tutorial)
  ├── User Guides
  │   ├── Automatic Workflow Selection (AI picks based on context + manual override)
  │   ├── Hands-On Tutorial (greenfield → enhancement → bugfix)
  │   └── Advanced Engineering (setup_project_docs, variables, branches, rules)
  └── Interactive Workflows (/workflows route - existing workflow-visualizer)
  ```
- **CONTENT STRATEGY BY PERSONA**:
  - **Beginner (First-time users)**: Value prop → Universal MCP setup → Hands-on tutorial (3 workflows)
  - **Intermediate (Regular users)**: Automatic workflow selection, manual override options
  - **Advanced (Power users)**: Engineering practices, custom workflows, rule files integration, trunk-based development
- **REVISED README.md STRUCTURE** (Max 2KB, focused on quick wins):
  ```
  # Responsible Vibe MCP
  [badges]
  
  Transform any AI coding agent into a structured development partner with battle-tested engineering workflows.
  
  ## ⚡ Quick Start
  # Works with ANY MCP-compatible agent
  npx responsible-vibe-mcp --generate-config amazonq-cli  # or claude, gemini, opencode
  # OR manually configure any MCP agent with our system prompt
  
  Ask your AI: "Help me implement a new feature"
  → Your agent now follows proven development methodologies
  
  ## What You Get
  ✅ Multiple battle-tested workflows (waterfall, EPCC, TDD, bugfix, greenfield)
  ✅ Context-aware process guidance (different practices for different scenarios)
  ✅ Project memory across conversations and branches
  ✅ Automatic documentation and decision tracking
  
  ## Universal MCP Support
  Any MCP-compatible agent | Preconfigured: Amazon Q CLI, Claude Code, Gemini CLI, OpenCode CLI
  
  📖 **[Complete Documentation →](https://mrsimpson.github.io/responsible-vibe-mcp/)**
  ```
- **REVISED VITEPRESS SITE RESTRUCTURE**:
  - **New Sidebar**: Getting Started (4 items) → User Guides (3 items) → Interactive Workflows (link to /workflows)
  - **Landing Page**: Value prop + differentiation + visual demo + universal MCP setup
  - **"How It Works" Section**: Detailed mechanics + what makes it different from other agentic tools
  - **Leverage Existing**: Use workflow-visualizer at /workflows route instead of duplicating content
- **"HOW IT WORKS" CONTENT STRATEGY**:
  ```
  ## How Responsible Vibe Works
  
  ### The Problem with Other Agentic Tools
  - Most AI coding tools are reactive (respond to requests)
  - No structured development methodology
  - No project memory or context persistence
  - One-size-fits-all approach
  
  ### Responsible Vibe's Approach
  - Proactive process guidance (tells AI what to do next)
  - Battle-tested engineering workflows for different scenarios
  - Persistent project memory across conversations and branches
  - Context-aware methodology selection
  
  ### Technical Architecture
  [MCP Server] ↔ [AI Agent] ↔ [You]
  - MCP server maintains state and provides phase-specific instructions
  - AI agent follows structured workflows instead of ad-hoc responses
  - You get consistent, methodical development process
  
  ### What Makes It Different
  1. Process-focused (not just tool-focused)
  2. Multiple proven methodologies (not single workflow)
  3. Long-term project memory (not conversation-limited)
  4. Universal MCP compatibility (not agent-specific)
  ```
- **ADVANCED ENGINEERING PRACTICES SECTION**:
  ```
  /guides/advanced-engineering/
  ├── project-documentation.md (setup_project_docs, templates, linking)
  ├── workflow-variables.md ($ARCHITECTURE_DOC, $REQUIREMENTS_DOC, etc.)
  ├── trunk-based-development.md (branch-specific plans, conversation isolation)
  ├── rule-files-integration.md (process vs deliverable guidance)
  └── long-term-memory.md (.vibe/docs structure, persistence)
  ```
- **CONTENT MIGRATION STRATEGY**:
  - **Phase 1**: New README.md (replace current 7.3KB with 2KB focused version)
  - **Phase 2**: Create new landing page and getting started section
  - **Phase 3**: Migrate existing content to new structure (user guides, reference)
  - **Phase 4**: Create advanced engineering practices section (net new content)
  - **Phase 5**: Add examples and integration patterns
- **VALIDATION APPROACH**:
  - **Success Metrics**: Time to first success <2 minutes, setup completion rate >90%
  - **User Scenarios**: New user setup, existing user finding advanced features, troubleshooting
  - **Testing Method**: Documentation walkthrough with different personas
**Current Documentation Structure:**
- **README.md**: 7.3KB, comprehensive but overwhelming for new users
- **docs/**: VitePress site with user guide, workflows, and dev docs
- **Sidebar Structure**: User Guide (5 items) + Development (4 items)
- **Key User Journey**: Get system prompt → Configure agent → Start using

**Identified Issues:**
1. **Cognitive Overload**: README tries to cover everything at once
2. **Setup Friction**: Multiple manual steps required even with "quick start"
3. **Mixed Audiences**: Beginners and advanced users see same content
4. **Scattered Information**: Setup info in multiple places
5. **No Progressive Onboarding**: All-or-nothing approach

**Best Practices Research:**
- **Progressive Disclosure**: Start with value prop, then simple setup, then advanced features
- **Success-First Approach**: Get users to success quickly, explain complexity later
- **Audience Segmentation**: Clear paths for different user types (new vs experienced)
- **Minimal Viable Setup**: Reduce friction to absolute minimum for first experience
- **Just-in-Time Information**: Provide details when users need them, not upfront

**Recommended New Structure:**
1. **Landing Page**: Clear value prop + 30-second setup
2. **Quick Start**: Minimal path to first success
3. **Guides**: Step-by-step tutorials for common scenarios
4. **Reference**: Complete documentation for advanced users
5. **Examples**: Real-world use cases and patterns

**CRITICAL MISSING: Advanced Engineering Practices**
- **setup_project_docs Tool**: Creates/links architecture.md, requirements.md, design.md with templates or symlinks
- **Workflow Variables**: $ARCHITECTURE_DOC, $REQUIREMENTS_DOC, $DESIGN_DOC for dynamic path resolution
- **Trunk-Based Development**: Automatic plan file naming per branch (development-plan-{branch}.md)
- **Rule Files Integration**: .amazonq/rules/ provides HOW of deliverables, responsible-vibe provides HOW of process
- **Long-Term Memory**: Persistent project context across conversations via .vibe/docs/ structure

**Advanced Features Discovered:**
- **Branch-Aware Conversations**: Each git branch gets its own conversation ID and plan file
- **Template System**: Multiple templates (arc42, comprehensive, freestyle, none) for project docs
- **File Linking**: Can symlink existing docs instead of creating new ones
- **Variable Substitution**: Runtime path resolution in workflow instructions

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
