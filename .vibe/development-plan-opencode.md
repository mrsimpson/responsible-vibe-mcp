# Development Plan: responsible-vibe (opencode branch)

*Generated on 2025-09-25 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Add support for opencode CLI to the responsible-vibe-mcp server, similar to existing support for q and gemini CLIs

## Explore
### Tasks
*All exploration tasks completed*

### Completed
- [x] Created development plan file
- [x] Analyze existing CLI support in codebase (q/gemini)
- [x] Understand current architecture and patterns
- [x] Research opencode CLI requirements and capabilities
- [x] Identify integration points and files that need modification
- [x] Document current CLI detection and configuration mechanisms

## Plan

### Phase Entrance Criteria:
- [x] Current codebase architecture is understood
- [x] Existing CLI support patterns (q/gemini) have been analyzed
- [x] Opencode CLI requirements and integration points are documented
- [x] Technical approach is clear

### Tasks
*All planning tasks completed*

### Completed
- [x] Design OpencodeConfigGenerator class structure
- [x] Define opencode.json configuration format  
- [x] Plan integration with existing factory pattern
- [x] Document configuration generation approach
- [x] Plan documentation updates
- [x] Define testing approach

## Code

### Phase Entrance Criteria:
- [x] Implementation plan has been created and reviewed
- [x] Technical design decisions have been made
- [x] Integration points and file changes are identified
- [x] Testing approach is defined

### Tasks
*All implementation tasks completed*

### Completed
- [x] Create OpencodeConfigGenerator class in config-generator.ts
- [x] Add opencode case to ConfigGeneratorFactory
- [x] Update supported agents list in index.ts
- [x] Update help text in index.ts
- [x] Add opencode section to docs/user/agent-setup.md
- [x] Update README.md with opencode support
- [x] Test the implementation manually
- [x] Run existing tests to ensure no regressions

## Commit

### Phase Entrance Criteria:
- [x] Core implementation is complete and functional
- [x] Existing tests pass
- [x] New functionality has been tested
- [x] Code is ready for final cleanup and documentation

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions

### OpencodeConfigGenerator Design
- **Class Structure**: Extend `ConfigGenerator` base class following existing pattern
- **Configuration Files**: Generate single `opencode.json` file (similar to Amazon Q's single file approach)
- **MCP Configuration**: Use opencode's native MCP format with local server configuration
- **Tool Control**: Include tool disabling configuration for `proceed_to_phase` based on user requirements
- **Schema**: Include JSON schema reference for validation

### Configuration Format
Based on opencode documentation and Amazon Q pattern:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "responsible-vibe-mcp": {
      "command": ["npx", "responsible-vibe-mcp"],
      "type": "local",
      "enabled": true
    }
  },
  "agent": {
    "vibe": {
      "description": "Responsible vibe development agent with structured workflows",
      "mode": "primary", 
      "prompt": "<full system prompt>",
      "permissions": {
        "responsible-vibe-mcp*proceed_to_phase": "ask"
      }
    }
  }
}
```

### Implementation Approach
- **Factory Integration**: Add 'opencode' case to `ConfigGeneratorFactory`
- **Consistent Pattern**: Follow same structure as other CLI generators
- **Error Handling**: Use existing error handling patterns from base class
- **Documentation**: Update all relevant documentation files consistently

### Documentation Updates Required
1. **src/index.ts**: Update help text and supported agents list (lines 68, 118, 139)
2. **docs/user/agent-setup.md**: Add opencode section with setup instructions
3. **README.md**: Add opencode to supported CLIs list and examples

### Testing Strategy
- **Unit Tests**: Follow existing pattern in test files
- **Integration Tests**: Test config generation produces valid opencode.json
- **Manual Testing**: Verify generated config works with opencode CLI
- **Schema Validation**: Ensure generated JSON matches opencode schema

## Notes

### Existing CLI Support Analysis
Current supported CLIs:
- **Amazon Q CLI**: Generates `.amazonq/cli-agents/vibe.json` with comprehensive config including MCP servers, tools, permissions
- **Claude Code**: Generates `CLAUDE.md` (system prompt), `.mcp.json` (MCP config), `settings.json` (permissions)  
- **Gemini CLI**: Generates `settings.json` (comprehensive config with MCP) and `GEMINI.md` (context file)

### Current Architecture
- **Factory Pattern**: `ConfigGeneratorFactory` creates appropriate generator classes
- **Abstract Base**: `ConfigGenerator` provides common functionality (system prompt generation, file writing, default MCP config)
- **Individual Generators**: Each CLI has its own class extending the base (`AmazonQConfigGenerator`, `ClaudeConfigGenerator`, `GeminiConfigGenerator`)

### OpenCode CLI Requirements
Based on research:
- **Configuration**: Uses `opencode.json` with JSON schema `https://opencode.ai/config.json`
- **MCP Support**: Native MCP support with local and remote servers under `mcp` object
- **Format**: Simple config format with `type: "local"`, `command` array, `enabled` boolean
- **Environment**: Supports environment variables in MCP server config
- **Similar Pattern**: Uses similar MCP configuration pattern to existing CLIs

### Integration Points Identified
Files that need modification:
1. **src/config-generator.ts**: Add new `OpencodeConfigGenerator` class
2. **src/index.ts**: Update supported agents list and help text (lines 68, 118, 139)
3. **docs/user/agent-setup.md**: Add opencode section to documentation
4. **README.md**: Add opencode to supported CLIs list (lines 26, 32)

### CLI Detection Mechanism
Current pattern:
1. CLI argument parsing in `index.ts` checks for `--generate-config <agent>`
2. Factory pattern in `ConfigGeneratorFactory.createGenerator()` creates appropriate generator
3. Each generator extends `ConfigGenerator` base class with common MCP config logic
4. Generators create agent-specific configuration files with system prompt integration

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
