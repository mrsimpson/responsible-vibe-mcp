# Game Design 🛠️

**My Game**: [GAME_NAME]  
**Platform**: [PLATFORM - from architecture.md]  
**Date**: [DATE]

---

## What This Document Is For

This document explains **HOW we organize and structure** the code for building the game.

Think of it like a construction plan:

- **Requirements** = What we're building
- **Architecture** = The main parts and their jobs
- **Design** (this doc) = How to organize the construction

**No code here - just the plan!** Actual code examples come during implementation.

---

## Core Concepts We'll Use

<!-- LLM INSTRUCTION:
Explain the 3-4 fundamental coding patterns the child will use repeatedly.
Keep explanations simple and concrete. Use analogies.
Platform-specific examples are good.

Typical patterns:

- State (Memory) 🧠
- Mechanics (Rules) 📏
- Presentation (Drawing) 🎨
- The Game Loop 🔄

-->

## Usage of libraries

<!--
There are many libraries providing e. g. physics or other game specific features. Based on the requirements, pick proper libraries and explain to the child what they do.
-->

## 🗺️ How Code Is Organized

<!-- LLM INSTRUCTION:
Show the actual file/sprite structure for this specific game.
Be concrete - list actual file names or sprite names.
Explain WHAT goes in each file and WHY.

IMPORTANT:
- Don't put everything in one file!
- Keep it object-oriented (one building block = one file)
- Match the building blocks from architecture.md
-->

### File Structure for [PLATFORM]

```
[ACTUAL_FILE_STRUCTURE]

Example for Browser/JavaScript:
game/
  ├── game.js       ← Game loop, manages everything
  ├── player.js     ← Player class (state, mechanics, drawing)
  ├── enemy.js      ← Enemy class
  └── main.js       ← Starts the game
```
