# Development Plan: responsible-vibe-mcp (merge-config branch)

*Generated on 2025-12-04 by Vibe Feature MCP*
*Workflow: [minor](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/minor)*

## Goal
Modify the `--generate-config opencode` command to merge the MCP server configuration with existing OpenCode configuration instead of overriding it completely.

## Explore
### Phase Entrance Criteria:
- [x] Development plan initialized

### Tasks

### Completed
- [x] Created development plan file
- [x] Located CLI entry point in packages/cli/src/cli.ts
- [x] Found config generation logic in packages/cli/src/config-generator.ts (OpencodeConfigGenerator class)
- [x] Analyzed existing opencode.json structure
- [x] Designed merge strategy for nested objects (deep merge)
- [x] Identified and documented edge cases

## Implement
### Phase Entrance Criteria:
- [x] Current implementation of `--generate-config opencode` is understood
- [x] Merging strategy is defined
- [x] Edge cases are identified and documented

### Tasks

### Completed (Initial OpenCode Implementation)
- [x] Added deep merge utility function with proper TypeScript types
- [x] Modified OpencodeConfigGenerator to read existing config
- [x] Implemented merge logic with error handling for invalid JSON
- [x] Tested with no existing config - creates new file as expected
- [x] Tested with existing config containing other MCP servers/agents - preserves existing entries and adds new ones
- [x] Tested with invalid JSON - provides clear error message
- [x] Tested updating existing vibe agent - new values replace old ones
- [x] Updated documentation in agent-setup.md to reflect merge behavior
- [x] Ran full test suite - all tests passed (42 test files, 317 tests)

### Completed (Extended to All Generators)
- [x] Added mergeWithExistingConfig() helper method to base ConfigGenerator class
- [x] Refactored OpencodeConfigGenerator to use new helper method
- [x] Added merge support to AmazonQConfigGenerator - merges vibe.json
- [x] Added merge support to ClaudeConfigGenerator - merges .mcp.json and settings.json
- [x] Added merge support to GeminiConfigGenerator - merges settings.json
- [x] Tested AmazonQ generator - preserves custom fields, merges MCP servers
- [x] Tested Claude generator - preserves custom MCP servers in .mcp.json
- [x] Tested Gemini generator - preserves custom settings and MCP servers
- [x] Updated documentation for all generators to reflect merge behavior
- [x] Ran full test suite - all tests passed (42 test files, 317 tests)

## Finalize
### Phase Entrance Criteria:
- [x] Implementation is complete and tested
- [x] Code works correctly for both new and existing configurations  
- [x] Documentation is updated
- [x] All generators support merge functionality

### Tasks

### Completed (Test Coverage)
- [x] Created comprehensive unit tests for deepMerge function (21 tests)
- [x] Added integration tests for merge functionality in all generators (8 tests)
- [x] All tests passing (49 total CLI tests)

### Completed (Code Quality)
- [x] Checked for debug output - all console.log statements are user-facing messages
- [x] Reviewed TODO/FIXME comments - none found
- [x] Checked for commented-out code - all comments are legitimate documentation
- [x] Reviewed documentation - agent-setup.md accurately describes merge behavior for all generators
- [x] Ran final tests - all 43 test files passed (345 tests)
- [x] Ran final linting - 0 errors, 0 warnings
- [x] Verified all generators work correctly with merge functionality

## Key Decisions

### Current Implementation Analysis
- **Location**: `packages/cli/src/config-generator.ts` - All generator classes
- **Current behavior**: Each generator overwrites its config files completely
- **Config structure**: Varies by agent, but all use nested JSON objects

### Merge Strategy Design
- **Approach**: Deep merge of nested objects using a shared helper method
  - Base class provides `mergeWithExistingConfig()` helper
  - All generators use this helper for JSON config files
  - Markdown files (CLAUDE.md, GEMINI.md) are always overwritten (generated content)
  - Preserve existing MCP servers, agents, and custom settings
  - Add or update only `responsible-vibe-mcp` and `vibe` entries
- **Conflict resolution**: New config values take precedence over existing ones (for the specific keys being updated)

### Generator-Specific Behavior
1. **AmazonQ**: Merges `.amazonq/cli-agents/vibe.json`
2. **Claude**: Merges `.mcp.json` and `settings.json`, overwrites `CLAUDE.md`
3. **Gemini**: Merges `settings.json`, overwrites `GEMINI.md`
4. **OpenCode**: Merges `opencode.json`

### Edge Cases Handled
1. **No existing file**: Create new file (backward compatible)
2. **Invalid JSON**: Report error with clear message and recovery instructions
3. **Missing top-level keys**: Add them if missing through merge
4. **Existing entries**: Update with new values while preserving other entries
5. **File permissions issues**: Standard error reporting

## Notes

### Implementation Summary
Successfully implemented configuration merging for **all** `--generate-config` commands. The feature now:
- Preserves existing MCP servers, agents, and custom settings when generating configuration
- Updates only the `responsible-vibe-mcp` server and `vibe` agent entries
- Provides clear error messages for invalid JSON with recovery instructions
- Maintains backward compatibility (creates new file if none exists)
- Works consistently across all supported agents (AmazonQ, Claude, Gemini, OpenCode)

### Files Modified
- `packages/cli/src/config-generator.ts`: 
  - Added `deepMerge()` utility function
  - Added `mergeWithExistingConfig()` helper method to base class
  - Updated all four generators (AmazonQ, Claude, Gemini, OpenCode) to use merge functionality
- `packages/docs/user/agent-setup.md`: Updated documentation for all generators to reflect merge behavior

### Testing
- Manual testing: All scenarios verified (new config, merge, invalid JSON, update existing)
- Automated tests: 43 test files, 345 tests - all passing
  - Unit tests for deepMerge function: 21 tests covering all edge cases
  - Integration tests for all generators: 8 tests for merge scenarios
  - Existing tests: All still passing
- Code quality: 0 linting errors, 0 warnings

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
