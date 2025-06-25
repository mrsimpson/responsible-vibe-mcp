# Vibe Feature MCP Server - Usage Guide

## Installation and Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the server:**
   ```bash
   npm run build
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

## MCP Client Configuration

To use this server with an MCP client, configure it as a stdio transport:

```json
{
  "mcpServers": {
    "responsible-vibe": {
      "command": "node",
      "args": ["/path/to/responsible-vibe-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## Available Tools

### `start_development`
Initializes development workflow and transitions to the initial development phase. This tool **must be called first** before any other tools can be used.

**Parameters:**
- `workflow`: The development workflow to use (waterfall, agile, custom)

**Returns:**
- `phase`: Initial development phase
- `instructions`: Detailed instructions for the LLM
- `plan_file_path`: Path to the plan file to update
- `conversation_id`: Unique conversation identifier

### `whats_next`
The primary tool that analyzes conversation state and provides LLM instructions.

**Parameters:**
- `context` (optional): Additional context about current conversation
- `user_input` (optional): Latest user input for analysis  
- `conversation_summary` (optional): LLM-provided summary of the conversation so far
- `recent_messages` (optional): Array of recent conversation messages

**Returns:**
- `phase`: Current development phase
- `instructions`: Detailed instructions for the LLM
- `plan_file_path`: Path to the plan file to update
- `transition_reason`: Why this phase was chosen
- `is_modeled_transition`: Whether this is a modeled transition
- `conversation_id`: Unique conversation identifier

### `proceed_to_phase`
Explicitly transition to a new development phase.

**Parameters:**
- `target_phase`: The phase to transition to (idle, requirements, design, implementation, qa, testing, complete)
- `reason` (optional): Reason for transitioning now

**Returns:** Same format as `whats_next`

## Available Resources

### `plan://current`
Current development plan document in markdown format.

### `state://current`
Current conversation state and phase information in JSON format.

### `prompt://system`
Dynamically generated system prompt for LLM integration with comprehensive usage instructions.

## Development Phases

1. **idle**: Ready for new development tasks
2. **requirements**: Gathering and analyzing requirements
3. **design**: Technical design and architecture
4. **implementation**: Code development and building
5. **qa**: Quality assurance and code review
6. **testing**: Testing and validation
7. **complete**: Feature complete and ready for delivery

## Example Usage Flow

1. **Initialize development with a workflow:**
   ```json
   {
     "name": "start_development",
     "arguments": {
       "workflow": "waterfall"
     }
   }
   ```

2. **Start new feature:**
   ```json
   {
     "name": "whats_next",
     "arguments": {
       "user_input": "I want to implement user authentication",
       "context": "Starting new feature development"
     }
   }
   ```

2. **Continue in current phase:**
   ```json
   {
     "name": "whats_next",
     "arguments": {
       "conversation_summary": "We've gathered basic auth requirements",
       "user_input": "I need password reset functionality too"
     }
   }
   ```

3. **Explicit phase transition:**
   ```json
   {
     "name": "proceed_to_phase",
     "arguments": {
       "target_phase": "design",
       "reason": "Requirements are complete, ready for design"
     }
   }
   ```

## Project File Organization

The server creates a `.vibe` subdirectory in your project to store all responsible-vibe-mcp related files:

```
your-project/
├── .vibe/
│   ├── conversation-state.sqlite      # SQLite database for conversation state
│   ├── development-plan.md        # Main development plan (main/master branch)
│   └── development-plan-{branch}.md  # Branch-specific development plans
├── src/
├── package.json
└── ... (your project files)
```

### Plan File Management

The server automatically creates and manages development plan files:
- **Main branch**: `.vibe/development-plan.md`
- **Feature branches**: `.vibe/development-plan-{branch-name}.md`

The LLM is instructed to continuously update these files with:
- Task progress and completion status
- Technical decisions and design choices
- Implementation notes and progress
- Testing results and validation

### Database Storage

Conversation state is persisted in a project-local SQLite database:
`.vibe/conversation-state.sqlite`

This ensures:
- **Project isolation**: Each project has its own conversation state
- **Branch awareness**: Different branches can have separate development contexts
- **Persistence**: State survives server restarts and provides conversation continuity
- **Portability**: Database travels with your project

## Project Identification

Each conversation is uniquely identified by:
- **Project path**: Absolute path to current working directory
- **Git branch**: Current git branch (or 'no-git' if not in a git repo)

This allows multiple projects and branches to have independent conversation states.

## System Prompt Generation

Generate an up-to-date system prompt for LLM integration:

```bash
npm run generate-system-prompt
```

This creates `SYSTEM_PROMPT.md` with comprehensive instructions for LLMs, including:
- Core interaction patterns with `whats_next()` and `proceed_to_phase()`
- All development phases with specific instructions
- Phase transition guidance and examples
- Best practices for plan file management

The system prompt is also available as an MCP resource at `prompt://system`.

## Testing

Run the comprehensive test suite:
```bash
npm test -- --run
```

This includes:
- Server initialization tests
- Tool functionality tests
- Resource availability tests
- Phase transition tests
- System prompt generation tests

## Troubleshooting

### Server won't start
- Check that all dependencies are installed: `npm install`
- Ensure the project is built: `npm run build`
- Check for TypeScript errors: `npm run build`

### Database issues
- Database is created automatically in `.vibe/conversation-state.sqlite`
- Delete the `.vibe` directory to reset conversation state for the project
- Check file permissions on the project directory

### Git detection issues
- Server works without git (uses 'no-git' as branch name)
- Ensure you're in the correct project directory
- Check git repository status with `git status`

### Plan file issues
- Plan files are created automatically in `.vibe/` directory
- Ensure the project directory is writable
- Check that the `.vibe` directory isn't ignored by git (add to .gitignore if needed)

## Development

### Project Structure
```
src/
├── index.ts                    # Main server entry point
├── state-machine.ts           # State machine definitions and transitions
├── database.ts                # SQLite database management
├── conversation-manager.ts    # Conversation identification and state
├── transition-engine.ts       # Phase transition logic
├── instruction-generator.ts   # LLM instruction generation
├── plan-manager.ts           # Plan file management
├── system-prompt-generator.ts # Dynamic system prompt generation
└── scripts/
    └── generate-system-prompt.ts # System prompt generation script
```

### Building
```bash
npm run build                    # Compile TypeScript
npm run clean                   # Clean build directory
npm run dev                     # Build and run in watch mode
npm run generate-system-prompt  # Generate SYSTEM_PROMPT.md
```

### Architecture
The server follows a modular architecture with clear separation of concerns:
- **Conversation Manager**: Handles project identification and state persistence
- **Transition Engine**: Analyzes context and determines phase transitions
- **Instruction Generator**: Creates contextual LLM guidance
- **Plan Manager**: Manages development plan files in `.vibe/` directory
- **Database**: Provides project-local persistent state storage
- **System Prompt Generator**: Creates dynamic, up-to-date LLM integration instructions

### Git Integration
- Add `.vibe/` to your `.gitignore` if you don't want to commit conversation state
- Or commit `.vibe/development-plan.md` to share development plans with your team
- The database file (`.vibe/conversation-state.sqlite`) should typically be ignored
