# Development Plan: responsible-vibe (ship-skill branch)

*Generated on 2026-02-21 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Create a skill file for responsible-vibe-mcp that includes MCP dependency declaration for @codemcp/workflows package, enabling agentskills-mcp-server to automatically install and expose the responsible-vibe-mcp functionality with its required dependencies.

## Explore
<!-- beads-phase-id: responsible-vibe-13.1 -->
### Tasks

*Tasks managed via `bd` CLI*

## Plan
<!-- beads-phase-id: responsible-vibe-13.2 -->

### Phase Entrance Criteria:
- [ ] Requirements for skill file format and MCP dependency declaration are understood
- [ ] Existing skill templates have been analyzed
- [ ] @codemcp/workflows package dependency requirements are clear
- [ ] Integration approach with agentskills-mcp-server is defined

### Tasks

*Tasks managed via `bd` CLI*

## Code
<!-- beads-phase-id: responsible-vibe-13.3 -->

### Phase Entrance Criteria:
- [ ] Skill file structure and format are planned
- [ ] MCP dependency declaration format is defined
- [ ] File location and naming convention are determined
- [ ] Integration testing approach is planned

### Tasks

*Tasks managed via `bd` CLI*

## Commit
<!-- beads-phase-id: responsible-vibe-13.4 -->

### Phase Entrance Criteria:
- [ ] Skill file with MCP dependency is created
- [ ] File is properly integrated into the project structure
- [ ] Basic validation confirms the skill file format is correct
- [ ] Documentation is updated if needed

### Tasks

*Tasks managed via `bd` CLI*

## Key Decisions
**Skill File Format Analysis**:
- Two existing templates: SKILL.md (basic) and POWER.md (extended)
- Both use YAML frontmatter format with markdown content
- Key fields: name, description, allowed-tools, license, metadata
- POWER.md adds: displayName, keywords for better discoverability
- Version uses ${VERSION} placeholder for dynamic replacement
- No existing MCP dependency declaration format found in templates

**MCP Dependency Format (from agentskills-mcp-server)**:
- Field name: `requires-mcp-servers` (YAML) → `requiresMcpServers` (TypeScript)
- Format: Array of McpServerDependency objects
- Required fields per dependency: name, description, command
- Optional fields: package, args, env, parameters
- Parameters support placeholders like {{WORKSPACE_PATH}}
- Example structure found in agentskills demo

**@codemcp/workflows Package Structure**:
- Package name: @codemcp/workflows (MCP server implementation)
- Depends on: @codemcp/workflows-core (core functionality)
- Includes workflow files via build process (copied from root resources/)
- Self-contained after build with all required workflow files
- Command: Should use npx @codemcp/workflows for execution

**Final Implementation**:
- **Modified**: `resources/templates/skills/SKILL.md` to include MCP dependency
- **Created**: `scripts/generate-skill.js` for build-time skill generation
- **Updated**: `package.json` build script to include skill generation
- **Updated**: `.gitignore` to exclude generated `SKILL.md` from version control
- **Generated**: `SKILL.md` in project root with version 5.0.1 and MCP dependency

## Notes
**Implementation Summary**:
Successfully created a skill file for responsible-vibe-mcp that includes MCP dependency declaration for @codemcp/workflows package. The solution:

1. **Modified the existing SKILL.md template** to include `requires-mcp-servers` field
2. **Created automated build process** that generates the final skill file with version substitution
3. **Integrated with existing build system** so skill file is generated on every build
4. **Properly configured for agentskills-mcp-server** with correct dependency format

The generated skill file enables agentskills-mcp-server to automatically install and configure the @codemcp/workflows MCP server when the responsible-vibe skill is installed, providing users with the complete structured development workflow functionality.

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
