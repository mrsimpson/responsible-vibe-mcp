# Development Plan: responsible-vibe (version-information branch)

*Generated on 2026-01-19 by Vibe Feature MCP*
*Workflow: [minor](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/minor)*
*Task Management: Beads Issue Tracker*

## Goal
Add version information to the MCP server's `get_tool_info` tool to allow clients to identify which version they're running. The version should be determined at build time, using commit hash for local development identification.

## Explore
<!-- beads-phase-id: responsible-vibe-3.1 -->
### Tasks

**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent <phase-task-id> --status open`
- `bd create "Task title" --parent <phase-task-id> -p 2`
- `bd close <task-id>`

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
- [x] Created development plan file

## Implement
<!-- beads-phase-id: responsible-vibe-3.2 -->

### Phase Entrance Criteria:
- [x] The current `get_tool_info` tool implementation has been analyzed
- [x] Build-time version determination approach has been designed
- [x] Local development version identification strategy (commit hash) is defined
- [x] Integration approach with existing tool structure is clear

### Tasks

**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent <phase-task-id> --status open`
- `bd create "Task title" --parent <phase-task-id> -p 2`
- `bd close <task-id>`

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
*None yet*

## Finalize
<!-- beads-phase-id: responsible-vibe-3.3 -->

### Phase Entrance Criteria:
- [x] Version information is properly exposed through `get_tool_info` tool
- [x] Build-time version determination is working correctly
- [x] Local development shows commit hash as version identifier
- [x] Changes have been tested and are working as expected

### Tasks

**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent <phase-task-id> --status open`
- `bd create "Task title" --parent <phase-task-id> -p 2`
- `bd close <task-id>`

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
*None yet*

## Key Decisions

### Current Analysis
- **Current Implementation**: Version is hardcoded as `'3.1.6-monorepo'` in `get-tool-info.ts` line 210
- **Package Version**: Both root and mcp-server package.json show version `4.8.0` 
- **Git Versioning**: Project uses git tags (current: `v4.8.0-1-gbbb06ba-dirty`)

### CI/CD Analysis
**Current CI workflows are compatible with the implementation:**
- Both PR and release workflows run `pnpm run build` (TypeScript compilation)
- My version utility works at runtime, so no CI changes are needed
- The BUILD_TIME_VERSION constant is prepared for future build-time injection if desired
- Current git-based approach works perfectly for both local development and CI

**No CI adaptation required** - the implementation uses runtime version detection that works in all environments.
1. **Created version-info.ts utility module** that:
   - Supports build-time version injection (BUILD_TIME_VERSION constant)
   - Falls back to git describe for local development
   - Reads package.json version as secondary fallback
   - Provides structured VersionInfo interface with version, commit, dirty status
   - Includes formatted version string function
2. **Modified get-tool-info.ts** to use `getFormattedVersion()` instead of hardcoded version
3. **Testing confirmed** working version detection:
   - Version: "4.8.0" (from git tag)
   - Commit: "bbb06ba" (current commit hash)
   - Status: "dirty" (uncommitted changes)
   - Formatted: "4.8.0+bbb06ba.dirty"

### Version Determination Strategy
1. **Build-time approach**: Use build process to inject version into compiled code
2. **Local development**: Use `git describe --tags --always --dirty` for commit-based identification
3. **Production builds**: Use package.json version combined with git info when available

### Integration Design
1. Create a version utility module that:
   - Attempts to read version from build-time injected constant
   - Falls back to git describe for local development
   - Provides structured version information (version, commit, dirty status)
2. Modify get-tool-info.ts to use this version utility instead of hardcoded string
3. Use build process (TypeScript compilation) to inject version info during build

## Notes
*Additional context and observations*

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
