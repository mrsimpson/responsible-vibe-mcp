# Development Plan: Skills Generation Feature

*Generated on 2026-02-18 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal

Enhance the responsible-vibe CLI to generate "skills" for various AI agent platforms (Claude Code, OpenCode, Kiro, GitHub Copilot, Gemini). This will allow responsible-vibe workflows, phases, and guidance to be packaged as portable skills that AI agents can load on-demand.

## Explore
<!-- beads-phase-id: TBD -->

### Research Summary

All five major platforms converge on the **Agent Skills open standard** (agentskills.io):

| Platform | Skill File | Project Path | Global Path |
|----------|------------|--------------|-------------|
| Claude Code | `SKILL.md` | `.claude/skills/` | `~/.claude/skills/` |
| OpenCode | `SKILL.md` | `.opencode/skills/` | `~/.config/opencode/skills/` |
| Kiro | `SKILL.md` | `.kiro/skills/` | `~/.kiro/skills/` |
| GitHub Copilot | `SKILL.md` | `.github/skills/` | `~/.copilot/skills/` |
| Gemini | `SKILL.md` | `.gemini/skills/` | `~/.gemini/skills/` |

**Common Format:** Markdown + YAML frontmatter
- `name` (required): lowercase, hyphens, max 64 chars
- `description` (required): when to use the skill
- `allowed-tools` (optional): pre-approved tools
- `license`, `metadata` (optional)

**Key Insight:** Generate one standard `SKILL.md`, deploy to multiple platform directories.

### Tasks

- [x] Research Claude Code skills support
- [x] Research OpenCode skills support  
- [x] Research Kiro skills support
- [x] Research GitHub Copilot skills support
- [x] Research Gemini skills support
- [x] Explore current responsible-vibe codebase structure
- [x] Identify what content from workflows could become skills
- [x] Determine integration points with existing CLI

### Codebase Exploration Findings

**Project Structure:**
- `packages/cli/` - CLI implementation with `config-generator.ts` pattern
- `packages/core/` - Core workflow engine
- `resources/workflows/` - YAML workflow definitions (epcc, waterfall, tdd, bugfix, etc.)
- `resources/agents/` - Agent configurations

**Existing Pattern:** `config-generator.ts`
- Uses abstract `ConfigGenerator` base class
- `GeneratorRegistry` for discovery and instantiation
- Generators for: amazonq-cli, claude, gemini, opencode, copilot-vscode
- Each generates platform-specific config files

**Workflow YAML Structure:**
```yaml
name: 'epcc'
description: "Comprehensive workflow..."
initial_state: 'explore'
metadata:
  domain: 'code'
  complexity: 'medium'
  bestFor: [...]
states:
  explore:
    description: '...'
    default_instructions: '...'
    transitions: [...]
```

**Skill Generation Opportunities:**
1. **Workflow skills**: Each workflow (epcc, tdd, waterfall) → skill with phase instructions
2. **Phase skills**: Individual phases (explore, plan, code) → reusable skills
3. **Review perspective skills**: Architect, security expert, performance engineer
4. **Meta skill**: responsible-vibe itself as a skill (the whole system prompt)

*Tasks managed via `bd` CLI*

## Plan
<!-- beads-phase-id: responsible-vibe-12 -->

### Phase Entrance Criteria:
- [x] Current codebase structure is understood
- [x] Clear understanding of what responsible-vibe content maps to skills
- [x] Integration approach with existing CLI commands is identified
- [x] Scope is defined (which platforms, which features)

### Technical Design

**Approach:** New `skill <platform>` CLI command as alternative to `--generate-config`

**CLI Interface:**
```bash
responsible-vibe-mcp skill <platform>   # Generate skill + MCP config
responsible-vibe-mcp skill list         # Show supported platforms
```

**Key Difference from --generate-config:**
- `--generate-config`: Full agent config with system prompt always loaded
- `skill`: SKILL.md with on-demand loading, replaces system prompt

**Generated Output by Platform:**

| Platform | Output |
|----------|--------|
| Claude | `.claude/skills/responsible-vibe/SKILL.md` + `.mcp.json` |
| OpenCode | `.opencode/skills/responsible-vibe/SKILL.md` + `opencode.json` (MCP section) |
| Kiro | `.kiro/powers/responsible-vibe/POWER.md` + `mcp.json` (bundled) |
| Copilot | `.github/skills/responsible-vibe/SKILL.md` + `.vscode/mcp.json` |
| Gemini | `.gemini/skills/responsible-vibe/SKILL.md` + `settings.json` (MCP section) |

**SKILL.md Content:**
- YAML frontmatter: name, description, allowed-tools, license, metadata
- Full system prompt content (replaces CLAUDE.md/GEMINI.md)
- On-demand loading when agent sees matching task

**Kiro Power Format:**
```
.kiro/powers/responsible-vibe/
├── POWER.md    # Metadata + keywords + instructions
└── mcp.json    # Bundled MCP server config
```

**Implementation Approach:**
1. Create skill template using existing `generateSystemPrompt()` for content
2. Create `SkillGenerator` base class (similar to ConfigGenerator)
3. Platform-specific generators for each target
4. Special handling for Kiro (Power format)
5. New CLI subcommand parsing in cli.ts

### Tasks

*Tasks managed via `bd` CLI - see responsible-vibe-12.*

## Code
<!-- beads-phase-id: responsible-vibe-12 -->

### Phase Entrance Criteria:
- [x] Technical approach is documented
- [x] File structure for generated skills is defined
- [x] CLI command interface is designed (extend existing --generate-config)
- [x] Template structure for skill generation is planned

### Tasks

*Tasks managed via `bd` CLI*

## Commit
<!-- beads-phase-id: responsible-vibe-12 -->

### Phase Entrance Criteria:
- [x] Core skill generation functionality is implemented
- [x] At least one platform output format works (all 5 work!)
- [x] Tests are passing (14/14 skill generator tests)
- [x] Code has been reviewed/verified

### Tasks
- [ ] Squash WIP commits: `git reset --soft <first commit of this branch>`. Then, create a conventional commit. In the message, first summarize the intentions and key decisions from the development plan. Then, add a brief summary of the key changes and their side effects and dependencies

*Tasks managed via `bd` CLI*

## Key Decisions

1. **Standard Adoption**: Use agentskills.io standard as the base format since all platforms converge on it
2. **Multi-platform Support**: Generate to platform-specific directories rather than requiring users to manually copy
3. **Option B Selected**: Skills as MCP Server Companion - skills provide discoverability and context, MCP server provides the actual tools and state management. No standalone/offline mode, no per-workflow skill library.
4. **Separate CLI Command**: New `skill <platform>` command as alternative to `--generate-config`, not an extension
5. **Skills Replace System Prompts**: SKILL.md contains full instructions (previously in CLAUDE.md/GEMINI.md), loaded on-demand instead of always
6. **Kiro Uses Powers**: Kiro gets native Power format with bundled mcp.json, not just a skill

## Notes

### Platform-Specific Considerations
- **Kiro**: Has additional "Powers" concept for MCP bundles - may warrant special handling
- **Copilot**: Also has custom agents (`.github/agents/`) and prompt files
- **Cross-compatibility**: OpenCode reads `.claude/skills/`, Gemini reads `.agents/skills/`

### Potential Skill Content Sources
- Workflow definitions (epcc, waterfall, tdd, etc.)
- Phase-specific instructions
- Review perspectives
- Development best practices embedded in tools

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
