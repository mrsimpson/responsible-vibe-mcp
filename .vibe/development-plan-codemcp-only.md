# Development Plan: responsible-vibe (codemcp-only branch)

*Generated on 2025-10-09 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix the @codemcp/workflows MCP server to work standalone by including the missing workflow files

## Reproduce
### Tasks
- [x] Examine project structure and understand the issue
- [x] Identify that @codemcp/workflows package depends on @codemcp/workflows-core
- [x] Analyze workflow loading mechanism in WorkflowManager
- [x] Confirm that workflow files are in resources/workflows directory
- [x] Test if workflow files are included when package is built/published
- [x] Reproduce the exact error when trying to use @codemcp/workflows standalone
- [x] Document the specific steps that trigger the missing workflow files issue

### Completed
- [x] Created development plan file

### Key Findings
**Issue Confirmed**: The `@codemcp/workflows` and `@codemcp/workflows-core` packages do NOT include the workflow files from `resources/workflows/`. Only the main `responsible-vibe-mcp` package includes these files.

**Root Cause**: 
- The workflow files are located in `/resources/workflows/` at the project root
- Individual packages (`@codemcp/workflows` and `@codemcp/workflows-core`) don't have a `files` field in their package.json that includes the workflow files
- The WorkflowManager in `@codemcp/workflows-core` tries to find workflow files using multiple strategies, but when the packages are installed standalone, none of the strategies can locate the workflow files

**Evidence**:
- `npm pack` on main package shows: `resources/workflows/*.yaml` files included
- `npm pack` on `@codemcp/workflows` shows: NO workflow files included
- `npm pack` on `@codemcp/workflows-core` shows: NO workflow files included

## Analyze
### Phase Entrance Criteria:
- [x] The bug has been successfully reproduced
- [x] Exact steps to trigger the issue are documented
- [x] Error messages and symptoms are captured
- [x] Impact and scope of the issue is understood

### Tasks
- [x] Analyze the package structure and identify why workflow files are missing
- [x] Examine the WorkflowManager's file resolution strategies
- [x] Identify the root cause: individual packages don't include workflow files
- [x] Determine the best solution approach
- [x] Evaluate different fix strategies
- [x] Document the chosen approach and rationale

### Solution Options Evaluated

**Option 1: Include workflow files in @codemcp/workflows-core package**
- ✅ Pros: Simple, direct fix. Core package contains the workflows it needs
- ✅ Pros: Maintains current architecture
- ❌ Cons: Duplicates workflow files across packages (main + core)
- ❌ Cons: Increases package size

**Option 2: Include workflow files in @codemcp/workflows package**  
- ✅ Pros: MCP server package is self-contained
- ❌ Cons: Workflows logically belong in core, not server
- ❌ Cons: Violates separation of concerns

**Option 3: Create separate @codemcp/workflows-data package**
- ✅ Pros: Clean separation of code and data
- ✅ Pros: Avoids duplication
- ❌ Cons: Adds complexity with another package
- ❌ Cons: Breaking change for existing users

**Option 4: Bundle workflows into core package at build time**
- ✅ Pros: No duplication in source, but included in built package
- ✅ Pros: Maintains clean architecture
- ✅ Pros: No breaking changes
- ❌ Cons: Requires build process changes

**Chosen Approach: Option 4 - Bundle workflows into core package at build time** ✅

**Rationale** (User Selected):
- No duplication in source code
- Maintains clean architecture  
- No breaking changes for existing users
- Workflows are copied to core package during build process
- Self-contained packages after build

### Completed
*None yet*

### Root Cause Analysis

**Primary Issue**: The individual npm packages (`@codemcp/workflows` and `@codemcp/workflows-core`) do not include the workflow files that are required for the MCP server to function.

**Technical Details**:
1. **File Location**: Workflow files are stored in `/resources/workflows/` at the project root
2. **Package Structure**: The project uses a monorepo structure with multiple packages
3. **File Inclusion**: Only the main `responsible-vibe-mcp` package includes `resources/**/*` in its `files` array
4. **Individual Packages**: Neither `@codemcp/workflows` nor `@codemcp/workflows-core` have a `files` field that includes workflow files

**WorkflowManager Resolution Strategies**:
The WorkflowManager tries multiple strategies to find workflow files:
1. Local resources directory (symlinked from root) - fails in standalone install
2. Relative paths from current file - fails in standalone install  
3. Package root search - fails because individual packages don't contain the files
4. node_modules paths - fails because workflow files aren't in individual packages
5. npx cache locations - fails for same reason
6. require.resolve - fails because it looks for main package, not individual ones

**Why This Happens**:
- The monorepo publishes individual packages that depend on each other
- The workflow files are treated as "shared resources" only included in the main package
- When someone installs just `@codemcp/workflows`, they don't get the workflow files
- The WorkflowManager assumes workflow files will be available through various resolution strategies, but none work for standalone package installation

## Fix
### Phase Entrance Criteria:
- [x] Root cause has been identified and documented
- [x] Fix approach has been determined
- [x] Potential side effects have been considered
- [x] Implementation plan is clear

### Tasks
- [x] Modify @codemcp/workflows-core package.json to include workflow files
- [x] Update build process to copy workflow files to core package during build
- [x] Test that workflow files are included in the built core package
- [x] Verify WorkflowManager can find workflows in standalone installation
- [x] Update any build scripts or CI/CD processes if needed

### Completed
- [x] Added `files` field to package.json including `resources/**/*`
- [x] Modified build script to copy workflow files from root to package
- [x] Updated clean script to remove copied resources
- [x] Verified workflow files are included in npm pack output (12 workflow files, ~200KB total)
- [x] Tested WorkflowManager successfully loads workflows from bundled resources directory
- [x] Confirmed all 6 code-domain workflows are available and functional

## Verify
### Phase Entrance Criteria:
- [ ] Fix has been implemented
- [ ] Code changes are complete
- [ ] Implementation follows the planned approach
- [ ] Basic functionality testing is ready

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Finalize
### Phase Entrance Criteria:
- [ ] Fix has been verified to work correctly
- [ ] No regressions have been introduced
- [ ] All tests pass
- [ ] Solution is ready for production

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
*Important decisions will be documented here as they are made*

## Notes
*Additional context and observations*

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
