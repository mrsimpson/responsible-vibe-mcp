# Memory Systems

Responsible Vibe implements a three-layer context engineering approach that transforms AI from chaotic assistant to capable execution partner.

## Overview on Layers of Context

<div class="three-layers-container">
  <div class="layer layer-conversation">
    <div class="layer-icon">💬</div>
    <div class="layer-content">
      <h3>Conversation Memory</h3>
      <p>As outlined in <a href="./how-it-works">how it works</a></p>
    </div>
  </div>
  
  <div class="layer layer-process">
    <div class="layer-icon">⚙️</div>
    <div class="layer-content">
      <h3>Process Memory</h3>
      <p>Phase-aware development plans</p>
    </div>
  </div>
  
  <div class="layer layer-longterm">
    <div class="layer-icon">📚</div>
    <div class="layer-content">
      <h3>Long-term Memory</h3>
      <p>Requirements, Architecture, Design</p>
    </div>
  </div>
</div>

<style scoped>
.three-layers-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
}

.layer {
  display: flex;
  align-items: center;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 2px solid;
  transition: transform 0.2s ease;
}

.layer:hover {
  transform: scale(105%);
}

.layer-conversation {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2));
  border-color: rgba(59, 130, 246, 0.4);
  border-style: dashed;
}

.layer-process {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2));
  border-color: rgba(34, 197, 94, 0.4);
}

.layer-longterm {
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(168, 85, 247, 0.2));
  border-color: rgba(147, 51, 234, 0.4);
}

.layer-icon {
  margin-right: 2rem;
  flex-shrink: 0;
  font-size: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layer-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.layer-content p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.8;
}
</style>

### Layer 1: Conversation Memory

**Systematic thinking and organized problem analysis**

We outlined this in [How it works](./how-it-works.md)

### Layer 2: Process Memory

**Phase-aware development plans and progress tracking**

- Current development phase and workflow state
- What's been completed vs what's remaining
- Decision history and reasoning

### Layer 3: Long-term Memory

**Requirements, Architecture, Design**

- Persistent project knowledge across sessions
- Read on-demand
- Created in early phases, permanently updated at the end of each feature

## Process Memory: Development Plans

### What It Is

**Process memory** is the development plan that steers the current conversation. Your AI actively maintains and updates this plan throughout the development process.

**How it works:**

- Responsible Vibe creates a **blank template** with sections for each workflow phase
- **Your AI is fully in charge** of maintaining what's in the plan
- The AI updates tasks, marks completions, documents decisions
- Used by `whats_next()` to determine current phase and next steps

### The AI's Responsibility

```markdown
## Requirements

### Tasks

- [ ] Understand user needs
- [ ] Document functional requirements
- [ ] Identify constraints

### Completed

- [x] Initial user interview
- [x] Core feature list defined

## Key Decisions

- Using JWT for authentication based on security requirements
- Terminal UI chosen for simplicity and cross-platform compatibility
```

**The AI writes this content.** Responsible Vibe only provides the structure.

### How It Steers Conversation

When you call `whats_next()`, the tool:

1. Reads the current development plan
2. Analyzes what's complete vs incomplete
3. Returns phase-specific instructions based on plan state
4. Guides the AI on what to focus on next

This is **active process memory** - it directly controls the conversation flow.

## Long-Term Memory: Project Documentation

### What It Is

**Long-term memory** is structured project documentation that can be explicitly referenced when needed. Unlike process memory, this doesn't automatically influence conversations.

### The `.vibe/docs/` System

```
.vibe/
├── docs/
│   ├── architecture.md    # System design decisions
│   ├── requirements.md    # What you're building
│   └── design.md         # Implementation approach
└── development-plan-feature-auth.md  # Process memory (current)
```

### Workflow Variable Substitution

Workflows can reference project documentation dynamically:

**In Workflow Instructions:**

```
"Review the system architecture documented in $ARCHITECTURE_DOC
and ensure your design addresses all requirements in $REQUIREMENTS_DOC."
```

**At Runtime:**

```
"Review the system architecture documented in /project/.vibe/docs/architecture.md
and ensure your design addresses all requirements in /project/.vibe/docs/requirements.md."
```

### Explicit Reference System

**Long-term memory requires explicit reference:**

```bash
# Reference in commits
git commit -m "implement user authentication

Based on security analysis in .vibe/docs/architecture.md,
implemented JWT with 24h expiry."

# Direct reference
"Check @.vibe/docs/architecture.md for the database schema decisions"
```

**Key difference:** Your AI must actively reference these documents - they don't automatically influence the conversation.

## Setting Up Project Documentation

### `setup_project_docs` Tool

Creates structured documentation for long-term reference:

**Template Options:**

- **arc42**: Industry-standard architecture documentation
- **comprehensive**: Detailed templates for all aspects
- **freestyle**: Minimal structure, maximum flexibility
- **none**: Placeholder that references plan file instead

**File Linking:**

```bash
"Link the existing README.md as architecture documentation"
# Creates: .vibe/docs/architecture.md → README.md (symlink)
```

## The Two Systems Working Together

### Layer 2: Process Memory (Active)

- **Development plan** maintained by AI
- **Automatically consulted** by `whats_next()`
- **Steers current conversation** and workflow phase
- **Updated continuously** during development

### Layer 3: Long-Term Memory (Passive)

- **Project documentation** created by `setup_project_docs`
- **Referenced explicitly** when needed
- **Survives across projects** and conversations
- **Workflow variable substitution** for consistent patterns

_Layer 1 (Conversation Memory) is handled by your AI agent's natural conversation flow and systematic thinking patterns._

## Real-World Example

```bash
# AI maintains process memory (development plan)
## Implementation
### Tasks
- [x] Set up JWT authentication
- [ ] Add password hashing
- [ ] Implement session management

# You reference long-term memory when needed
"Look at @.vibe/docs/architecture.md to see how we decided to handle user sessions"

# Workflow automatically references long-term memory
"Ensure your implementation follows the security patterns in $ARCHITECTURE_DOC"
```

## Why This Three-Layer Framework Matters

**Layer 1 (Conversation Memory)** provides systematic thinking and organized problem analysis within the current session.

**Layer 2 (Process Memory)** keeps your AI focused and on-track during active development with phase-aware guidance.

**Layer 3 (Long-Term Memory)** preserves architectural decisions and project knowledge that can be referenced when needed.

Together, these three layers provide the context AI needs to transform from chaotic assistant to capable execution partner - enabling both **active guidance** and **reference documentation** for serious software engineering.

---

**Next**: [Advanced Engineering](./advanced-engineering.md) – Branch management and rule files integration
