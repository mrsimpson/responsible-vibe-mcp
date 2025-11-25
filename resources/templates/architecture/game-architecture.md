# Game Architecture 🏗️

**Game**: [GAME_NAME]  
**Platform**: [PLATFORM_CHOICE]  
**Created**: [DATE]

---

## What This Document Is For

This document explains the **BIG PICTURE** of your game:

- What platform we're building on (Scratch? Browser? Python?)
- What the main building blocks are
- What each building block is responsible for
- How they work together

Think of it like planning with LEGO:

- **Platform** = What type of LEGO we're using
- **Building Blocks** = The main pieces we need
- **Responsibilities** = What each piece does

**No code, no files - just the big ideas!**

---

## Platform Decision

<!-- LLM: Document the platform choice based on conversation with child -->

**We chose [PLATFORM] because:**

- [REASON_1]
- [REASON_2]
- [REASON_3]

**Platform Options We Considered:**

| Platform                       | Best For                   | Pros                                                  | Cons                       |
| ------------------------------ | -------------------------- | ----------------------------------------------------- | -------------------------- |
| **Scratch**                    | Total beginners, ages 8-10 | Visual blocks, can't make syntax errors, easy sharing | Less control over graphics |
| **Browser (HTML5/JavaScript)** | Kids ready for "real" code | Works anywhere, full control, easy to share links     | Need to type carefully     |
| **Python + Pygame**            | Kids who know Python       | Desktop games, powerful                               | Need to install Python     |

---

## The Big Picture

<!-- LLM: Create a simple ASCII diagram showing main components and their relationships -->

```
┌─────────────────────────────────┐
│      GAME MANAGER 🎮            │
│   (The Boss - Runs Everything)  │
└─────────────────────────────────┘
              |
              |
    ┌─────────┴─────────┐
    |                   |
    v                   v
┌─────────┐       ┌─────────┐
│ PLAYER  │       │ ENEMIES │
│  🧍     │       │  👾     │
└─────────┘       └─────────┘
    |                   |
    └─────────┬─────────┘
              v
       ┌──────────────┐
       │   DISPLAY    │
       │   (Screen)   │
       └──────────────┘
```

**How it works:**

1. **Game Manager** is the boss - it controls everything
2. **Player** and **Enemies** do their own things
3. **Display** shows what's happening on screen
4. Game Manager makes sure they all work together!

---

## Building Blocks

<!-- LLM: For each building block, explain WHAT it does and its responsibilities.
Keep it conceptual - no code examples, no specific implementation details.
Focus on helping child understand the PURPOSE and ROLE of each block.
Use simple analogies they can relate to. -->

### 🎮 Game Manager

The main controller that runs the whole game.

**Responsibilities:**

- Keeps the game running
- Tells all the other parts when to do their jobs
- Checks if the player won or lost
- Keeps track of the score

**Why we need it:**
Every game needs someone in charge, like a referee in sports or a conductor in an orchestra.

---

### 🧍 Player

The character the player controls in the game.

**Responsibilities:**

- Knows where it is in the game world
- Remembers its health and score
- Moves when the player presses keys
- Checks if it touched something important

**Why we need it:**
This is YOU in the game! Without it, there's no way to play.

---

### 👾 Enemies

The obstacles or challenges in the game.

**Responsibilities:**

- Knows where they are
- Moves around in the game world
- Checks if they touched the player
- Makes the game challenging

**Why we need it:**
Games need challenges! Without enemies or obstacles, there's nothing to overcome.

---

### 🎯 [Additional Building Block]

<!-- LLM: Add other building blocks based on the specific game type.
Common examples:
- Collectibles (coins, power-ups, items)
- Projectiles (bullets, arrows, fireballs)
- Obstacles (walls, platforms, hazards)
- Level Manager (handles switching between levels)
- Sound Manager (plays music and sound effects)
- UI Manager (shows menus, buttons, messages)

Keep each description simple and focused on responsibilities. -->

[Describe building blocks specific to this game]

---

### 🖥️ Display

Shows everything on the screen.

**Responsibilities:**

- Draws the player
- Draws enemies and other game objects
- Shows the score and health
- Displays messages like "Game Over"

**Why we need it:**
We need to SEE what's happening! The display makes the invisible game visible.

---

## How They Work Together

<!-- LLM: Explain the overall flow in simple terms. Focus on relationships, not implementation. -->

Think of it like a team working together:

**The Game Loop** (what happens over and over, very fast):

1. **Game Manager** wakes everyone up: "Time to do your jobs!"
2. **Player** checks if keys were pressed and moves
3. **Enemies** move according to their patterns
4. **Game Manager** asks: "Did anything touch anything?"
   - Player hit enemy? → Player takes damage
   - Player got coin? → Score goes up
5. **Game Manager** asks **Display**: "Show what changed!"
6. **Display** redraws everything on screen
7. **Repeat!** This happens 60 times per second!

**This is like a movie** - it happens so fast your eyes see smooth movement!

---

## Why Separate Into Building Blocks?

Imagine your room:

- **Messy**: Everything in one big pile - hard to find anything
- **Organized**: Toys in toy box, books on shelf, clothes in closet - easy to find!

**Same with games!**

**All in one piece (BAD):**

- Hard to understand
- Hard to fix bugs
- Hard to add new features
- Confusing for everyone

**Separated into building blocks (GOOD):**

- Each block has ONE clear job
- Easy to find where something happens
- Easy to fix: "Enemy not moving? Check the Enemy block!"
- Easy to add: "Want new enemy types? Make a new Enemy block!"

**Professional game developers ALWAYS organize their games this way!**

---

## Key Decisions

<!-- LLM: Document important architectural decisions in simple terms -->

**Decision 1: [DECISION_TITLE]**

- **What we decided**: [Simple explanation]
- **Why**: [Reason in terms child understands]
- **Impact**: [How this helps the game]

**Decision 2: [DECISION_TITLE]**

- **What we decided**: [Simple explanation]
- **Why**: [Reason in terms child understands]
- **Impact**: [How this helps the game]

---

## Remember

**This is your game's blueprint!**

- It shows WHO does WHAT
- Each building block has its own job
- They work together like a team
- This is the BIG PICTURE - details come later!

**Next**: Look at the Design document to see HOW to build each block with actual code! 🛠️

Let's build something amazing! 🚀
