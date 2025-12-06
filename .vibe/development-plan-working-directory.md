# Development Plan: responsible-vibe (working-directory branch)

*Generated on 2025-12-06 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix the issue where development plans are stored in a central folder instead of the project-specific `.vibe` subfolder when using the MCP server with IDEs like VSCode. This leads to non-transparency and potential duplicate file names.

## Reproduce

### Tasks
- [x] Reproduce the issue in an IDE environment (VSCode)
- [x] Identify the exact conditions that cause plans to be stored in wrong location
- [x] Document the current behavior vs expected behavior
- [x] Gather information about how project path is determined in IDE contexts
- [x] Get specific details from user about their IDE setup and where files are appearing

### Completed
- [x] Created development plan file
- [x] Analyzed the codebase and identified potential root cause in `normalizeProjectPath` function
- [x] Confirmed reproduction conditions: Global MCP config uses ~/.vibe, local config works correctly
- [x] Successfully reproduced the bug with clear conditions

## Analyze

### Phase Entrance Criteria:
- [x] The bug has been successfully reproduced
- [x] The exact conditions triggering the issue are documented
- [x] The current vs expected behavior is clearly defined
- [x] Environment details (IDE, MCP client setup) are documented

### Tasks
- [x] Analyze the code path from MCP server initialization to project path determination
- [x] Examine how `process.cwd()` behaves in global vs local MCP configurations
- [x] Identify potential solutions for detecting the actual workspace directory
- [x] Research MCP protocol capabilities for workspace detection
- [x] Evaluate different approaches for project path resolution
- [x] Investigate if project directory is stored per conversation
- [x] Research how to detect workspace directory in global MCP configurations

### Completed
- [x] Identified the exact code path causing the issue
- [x] Confirmed root cause: `normalizeProjectPath` defaults to `process.cwd()`
- [x] Found existing test coverage for PROJECT_PATH environment variable
- [x] Determined that MCP protocol doesn't provide workspace detection capabilities
- [x] Identified solution: improve project path detection logic
- [x] **CRITICAL FINDING**: Project path IS stored per conversation in ConversationState
- [x] **BETTER SOLUTION**: Add optional `project_path` parameter to `start_development` tool

## Fix

### Phase Entrance Criteria:
- [x] Root cause has been identified and documented
- [x] The code path causing the issue is understood
- [x] A solution approach has been defined
- [x] Potential side effects have been considered

### Tasks
- [x] Add optional `project_path` parameter to `start_development` tool schema
- [x] Implement path normalization logic (strip /.vibe suffix)
- [x] Update start-development handler to use provided project path
- [x] Fix database synchronization issue with temporary conversation manager
- [x] Ensure backward compatibility (existing usage still works)
- [x] Create comprehensive unit tests for project_path parameter
- [x] Create integration test with external directory outside project hierarchy
- [x] Test path normalization logic (with and without /.vibe suffix)
- [x] Test that .vibe folder and docs are created in correct location
- [x] Add optional `project_path` parameter to `setup_project_docs` tool
- [x] Update setup_project_docs handler to use provided project path
- [x] Refactor duplicate normalizeProjectPath code into shared utility
- [x] Test setup_project_docs with external directory (via existing integration tests)

### Completed
- [x] Added project_path parameter to StartDevelopmentArgs interface
- [x] Added normalizeProjectPath helper method
- [x] Updated tool schema with proper parameter description
- [x] Updated handler to use normalized project path throughout
- [x] ~~Created temporary ConversationManager for custom project paths~~ (removed)
- [x] All existing tests pass - backward compatibility confirmed
- [x] ~~Identified issue: temporary database not synchronized with transition engine~~ (resolved)
- [x] Implemented cleaner approach: modified ConversationManager to accept project path overrides
- [x] **SOLUTION COMPLETE**: Single ConversationManager with project path override support

## Verify

### Phase Entrance Criteria:
- [ ] The fix has been implemented
- [ ] Code changes address the root cause
- [ ] Implementation follows the planned approach
- [ ] No obvious regressions have been introduced

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Finalize

### Phase Entrance Criteria:
- [ ] The fix has been verified to work correctly
- [ ] Original bug is resolved
- [ ] No new issues were introduced
- [ ] Testing confirms the solution is robust

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
**Root Cause Analysis Complete:**
- The issue is in `packages/mcp-server/src/server-config.ts` line 67-69
- `normalizeProjectPath()` function defaults to `process.cwd()` when no explicit path is provided
- In global MCP config: `process.cwd()` = home directory (~)
- In local MCP config: `process.cwd()` = project directory

**Existing Infrastructure:**
- PROJECT_PATH environment variable support already exists
- Test coverage exists in `test/integration/project-path-configuration.test.ts`
- The server already has `getProjectPath()` method for testing

**Solution Approach:**
The fix should detect the workspace directory when no explicit PROJECT_PATH is set, rather than defaulting to `process.cwd()`

**CRITICAL DISCOVERY:**
Yes! The project directory IS already stored per conversation in the `ConversationState` interface:
```typescript
export interface ConversationState {
  conversationId: string;
  projectPath: string;  // ← This stores the project path!
  gitBranch: string;
  currentPhase: string;
  planFilePath: string;
  // ... other fields
}
```

**BETTER SOLUTION IDENTIFIED:**
User suggested adding an optional `project_path` parameter to the `start_development` tool. This is much cleaner than trying to auto-detect workspace directories.

**Benefits:**
1. **Explicit control**: Agents can specify the exact working directory
2. **Backward compatible**: Optional parameter, existing behavior unchanged
3. **Simple implementation**: Just add parameter to tool schema and pass to conversation creation
4. **Solves the root issue**: No more reliance on `process.cwd()` for initial conversation creation

**REFINED IMPLEMENTATION PLAN:**
1. Add optional `project_path` parameter to `start_development` tool schema with specific instructions:
   - "Pass the .vibe subdirectory path if a .vibe directory exists in the project"
   - "Otherwise, pass the current project directory path"
2. In the implementation, detect if path ends with `/.vibe` and strip it to get project root
3. Use the resulting path as the project directory for conversation creation
4. Add tests for both scenarios (with and without .vibe suffix)

**Parameter Description:**
```
project_path: z.string().optional().describe(
  'Project directory path. Pass the .vibe subdirectory path if a .vibe directory exists in your project, otherwise pass the project root directory. The implementation will automatically detect and use the correct project root.'
)
```

**Implementation Logic:**
```typescript
// Strip /.vibe suffix if present to get project root
const projectRoot = providedPath.endsWith('/.vibe') 
  ? providedPath.slice(0, -6)  // Remove '/.vibe'
  : providedPath;
```

## Notes
**Initial Code Analysis:**
- The issue likely stems from the `normalizeProjectPath` function in `packages/mcp-server/src/server-helpers.ts`
- This function defaults to `process.cwd()` when no explicit project path is provided
- In IDE environments, `process.cwd()` might not be the workspace folder where users expect `.vibe` folders
- The server configuration uses this path to determine where to store development plans and conversation state

**Reproduction Details from User:**
- **Local Config (Works Correctly)**: When MCP configured locally in project folder (`.vscode/mcp.json`), `.vibe` folder is created in correct project location (`/private/tmp/demo-rv/.vibe`)
- **Global Config (Bug)**: When MCP configured globally (`~/Library/Application Support/Code/User/mcp.json`), `.vibe` folder is created in home directory (`~/.vibe`) instead of project directory

**Root Cause Confirmed:**
- When MCP server runs with global configuration, `process.cwd()` returns the home directory
- When MCP server runs with local configuration, `process.cwd()` returns the project directory
- The `normalizeProjectPath` function defaults to `process.cwd()` when no explicit `PROJECT_PATH` is provided

**Expected Behavior:**
- `.vibe` folder should always be created in the workspace/project directory where the user is working
- This should work regardless of whether MCP is configured globally or locally

**TESTING COMPLETE:**
- ✅ **Unit Tests**: 14 tests for path normalization logic covering edge cases, Windows paths, relative paths, and error conditions
- ✅ **Integration Tests**: 8 tests covering external directory creation, backward compatibility, error handling, and git integration
- ✅ **Full Test Suite**: All 345 existing tests continue to pass - no regressions introduced
- ✅ **Critical Scenarios Verified**: 
  - External directories outside project hierarchy work correctly
  - Path normalization strips /.vibe suffix properly
  - Backward compatibility maintained (works without project_path parameter)
  - Environment variable precedence handled correctly
  - Git operations work in external directories
  - Error handling for invalid paths and permissions

**Final Solution:**
Modified `ConversationManager.createConversationContext()` to accept optional `projectPathOverride` parameter. The start_development handler now passes the normalized project path directly to the existing ConversationManager, eliminating the need for temporary instances and ensuring all components use the same file storage.

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
