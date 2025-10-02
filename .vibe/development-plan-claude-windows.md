# Development Plan: responsible-vibe (claude-windows branch)

*Generated on 2025-10-02 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix GitHub issue #110: Wrong .mcp.json format for Claude on Windows. The tool generates .mcp.json with "npx" command directly, but on Windows Claude needs "cmd /c npx" format.

## Reproduce
### Tasks
- [ ] Examine current .mcp.json generation code
- [ ] Identify where the configuration is generated for Claude
- [ ] Reproduce the issue by checking current output format
- [ ] Document the exact difference between current and expected output

### Completed
- [x] Created development plan file
- [x] Retrieved GitHub issue details using gh CLI
- [x] Identified the bug: Windows Claude needs "cmd /c" prefix for npx commands
- [x] Located the bug in src/config-generator.ts line 58-62 in getDefaultMcpConfig() method
- [x] Reproduced the issue: Current code generates "npx" directly, Windows needs "cmd /c npx"

## Analyze

### Phase Entrance Criteria:
- [x] Bug has been successfully reproduced with clear steps
- [x] Environment and conditions for reproduction are documented
- [x] Error messages, logs, or stack traces are captured
- [x] Test cases demonstrating the problem are created

### Tasks
- [x] Analyze the getDefaultMcpConfig() method and its usage
- [x] Determine why Windows needs "cmd /c" prefix
- [x] Identify the best approach for platform detection
- [x] Check if other generators are affected
- [x] Design the fix approach

### Completed
- [x] Root cause: getDefaultMcpConfig() hardcodes npx without Windows detection
- [x] Windows ALL generators need "cmd /c" prefix for npx execution
- [x] CORRECTED Fix approach: Modify base getDefaultMcpConfig() method with Windows platform detection

## Fix

### Phase Entrance Criteria:
- [x] Root cause of the bug has been identified
- [x] Analysis of the problematic code paths is complete
- [x] Fix approach has been determined and documented
- [x] Impact assessment of the proposed fix is done

### Tasks
- [x] Modify getDefaultMcpConfig() method to detect Windows platform
- [x] Add Windows-specific command format for all generators
- [x] Test the fix works for all affected generators

### Completed
- [x] Implemented Windows platform detection using process.platform === 'win32'
- [x] Added conditional logic to return "cmd /c npx" format on Windows
- [x] Maintained backward compatibility for non-Windows platforms
- [x] Tested fix: Windows generates "cmd /c npx", macOS generates "npx"

## Verify

### Phase Entrance Criteria:
- [x] Bug fix has been implemented
- [x] Code changes address the identified root cause
- [x] Fix implementation follows the planned approach
- [x] No obvious regressions introduced during implementation

### Tasks
- [x] Run existing test suite to ensure no regressions
- [x] Test all generators (AmazonQ, Claude, Gemini, OpenCode) on simulated Windows
- [x] Verify backward compatibility on non-Windows platforms
- [x] Confirm the exact format matches GitHub issue requirements

### Completed
- [x] All 290 tests pass - no regressions introduced
- [x] AmazonQ, Claude, Gemini all generate correct Windows format: "cmd /c npx"
- [x] OpenCode uses different format (array) but works correctly
- [x] Backward compatibility confirmed: macOS/Linux still generates "npx" format
- [x] Fix matches exact GitHub issue requirements

## Finalize

### Phase Entrance Criteria:
- [x] Bug fix has been verified to work correctly
- [x] Original bug is resolved
- [x] No new issues or regressions introduced
- [x] All tests pass successfully

### Tasks
- [x] Remove temporary test files created during verification
- [x] Check for any debug output or temporary code
- [x] Update documentation if needed
- [x] Final test run to ensure everything works

### Completed
- [x] Cleaned up all temporary test files
- [x] Fixed platform detection to use exact comparison (=== 'win32')
- [x] No debug output or temporary code found
- [x] Final verification confirms Windows format works correctly
- [x] Bug fix is ready for production

## Key Decisions
- Bug affects ALL generators using getDefaultMcpConfig() on Windows (AmazonQ, Claude, Gemini)
- All npx commands on Windows need "cmd /c" prefix for proper execution
- Fix should be in the base getDefaultMcpConfig() method, not generator-specific overrides
- Use process.platform.startsWith('win') for robust Windows detection (covers win32, win64, etc.)

## Notes
- Issue affects only Windows platform (not WSL)
- Current format: {"command": "npx", "args": ["responsible-vibe-mcp"]}
- Required format: {"command": "cmd", "args": ["/c", "npx", "responsible-vibe-mcp"]}
- All generators (AmazonQ, Claude, Gemini) use the same base method

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
