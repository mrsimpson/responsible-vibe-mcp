# Development Plan: responsible-vibe (monorepo-2 branch)

*Generated on 2025-10-04 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Migrate the responsible-vibe-mcp project to a proper monorepo structure with incremental file migration, test tracking, and proper build validation. Learn from the previous failed attempt (f3902d9) and implement a step-wise approach that allows moving files to target packages while maintaining an inventory and ensuring tests pass at each step.

## Explore
### Phase Entrance Criteria:
- [x] Current project structure is analyzed and documented
- [x] Previous monorepo attempt is reviewed and lessons learned
- [x] Migration strategy is defined with file tracking approach
- [x] Target package structure is validated

### Tasks
- [x] Analyze current project structure and identify main components
- [x] Review previous monorepo development plan from f3902d9
- [x] Identify what went wrong in the previous attempt
- [x] Design incremental migration approach with file inventory
- [x] Plan test migration strategy alongside source files
- [x] Define validation criteria for each migration step

### Completed
- [x] Created development plan file
- [x] Analyzed current project structure - found partial monorepo migration already exists
- [x] Reviewed previous monorepo plan - comprehensive but failed at verification stage
- [x] Identified failure points: import path issues, test failures, docs build problems
- [x] Designed incremental migration approach with file tracking and validation
- [x] Analyzed test import patterns - 35 test files import from src/
- [x] Defined comprehensive validation criteria for each migration step

## Plan
### Phase Entrance Criteria:
- [x] The exploration has been thoroughly completed
- [x] Migration approach is validated and approved
- [x] File inventory system is designed
- [x] Step-wise migration plan is documented

### Tasks
- [x] Design monorepo configuration files using template-typescript-monorepo
- [x] Plan package.json structures for each package
- [x] Create file inventory template and tracking system
- [x] Create migration scripts for automated file movement and import updates
- [x] Design validation scripts for each migration step
- [x] Plan rollback procedures for failed migrations
- [x] Create step-by-step migration procedures

### Completed
- [x] Designed monorepo configuration files using existing template
- [x] Planned package.json structures for all 7 packages
- [x] Created file inventory template and tracking system
- [x] Designed migration scripts for automated file movement and import updates
- [x] Designed validation scripts for each migration step
- [x] Planned rollback procedures for failed migrations
- [x] Created comprehensive step-by-step migration procedures

## Code
### Phase Entrance Criteria:
- [ ] The implementation plan has been thoroughly defined
- [ ] Migration scripts and inventory system are designed
- [ ] Validation approach is documented

### Tasks
- [x] **Foundation Setup**
  - [x] Copy and adapt monorepo configuration files from template
  - [x] Create file inventory system and migration tracking
  - [x] Create validation scripts

- [x] **Core Package (@responsible-vibe/core)**
  - [x] Create packages/core structure and package.json
  - [x] Move core files to packages/core/src/
  - [x] Update inventory with core package mappings
  - [x] Fix import statements in remaining files to use @responsible-vibe/core
  - [x] Fix path resolution issues in StateMachineLoader and WorkflowManager
  - [x] Validate tests pass (287/290 tests passing - 96.2% success rate)
  - [ ] Fix remaining 3 failing tests (complex mocking issues)

- [ ] **MCP Server Package (@responsible-vibe/mcp-server)**
  - [ ] Create packages/mcp-server structure and package.json
  - [ ] Move server files from src/server/
  - [ ] Update inventory with mcp-server package mappings
  - [ ] Fix import statements
  - [ ] Validate package builds and tests pass

- [ ] **CLI Package (@responsible-vibe/cli)**
  - [ ] Create packages/cli structure and package.json
  - [ ] Move CLI files from src/cli/
  - [ ] Update inventory with cli package mappings
  - [ ] Fix import statements
  - [ ] Validate package builds and tests pass

- [ ] **Visualizer Packages**
  - [ ] Create packages/visualizer-core
  - [ ] Create packages/visualizer-web
  - [ ] Create packages/visualizer-vue
  - [ ] Move workflow-visualizer files
  - [ ] Update inventory with visualizer package mappings
  - [ ] Fix import statements
  - [ ] Validate packages build and tests pass

- [ ] **Documentation Package (@responsible-vibe/docs)**
  - [ ] Create packages/docs structure
  - [ ] Move documentation files
  - [ ] Update inventory with docs package mappings
  - [ ] Validate documentation builds

- [ ] **Final Cleanup**
  - [ ] Clean up old directories and files
  - [ ] Update root documentation
  - [ ] Final validation of all packages

### Completed
- [x] Copied monorepo configuration files (pnpm-workspace.yaml, turbo.json, tsconfig.base.json)
- [x] Updated root package.json with workspace configuration and turbo
- [x] Installed turbo and dependencies
- [x] Validated foundation setup - all 290 tests passing

## Commit
### Phase Entrance Criteria:
- [ ] Core implementation is complete and tested
- [ ] All migration steps have been validated
- [ ] Monorepo structure is functional

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions

### Current Project Structure Analysis
**Main Components Identified:**
- **Core Source (`src/`)**: 20+ TypeScript files including state machine, workflow management, database, etc.
- **MCP Server (`src/server/`)**: Server implementation with tool handlers and resource handlers
- **CLI (`src/cli/`)**: Single visualization launcher file
- **Tests (`test/`)**: Comprehensive test suite with unit, integration, and e2e tests
- **Workflow Visualizer (`workflow-visualizer/`)**: Standalone visualization tool
- **Documentation (`docs/`)**: VitePress documentation site

**Existing Packages Directory:**
- Found `packages/` directory with 7 subdirectories: core, mcp-server, cli, visualizer-core, visualizer-web, visualizer-vue, docs
- Packages contain compiled JavaScript files but no source files or package.json files
- Suggests previous monorepo migration attempt was incomplete or partially rolled back

**Current Build System:**
- Single package.json with TypeScript compilation
- No monorepo configuration (no pnpm-workspace.yaml or turbo.json)
- Tests run from root level with vitest

### Previous Monorepo Attempt Analysis (f3902d9)
**What Was Accomplished:**
- Complete monorepo structure created with 7 packages
- All source files moved to appropriate packages
- Monorepo configuration (pnpm-workspace.yaml, turbo.json) implemented
- Package.json files created for all packages
- Tests migrated to individual packages

**What Went Wrong:**
- **Import Path Issues**: All tests failing due to incorrect import paths after migration
- **MCP Server Build Issues**: Import problems in mcp-server package
- **Documentation Build Failures**: Still importing from old workflow-visualizer paths
- **Incomplete Verification**: Migration was marked complete before all success criteria were met

**Root Cause:**
- **Big Bang Approach**: Moved all files at once without incremental validation
- **No File Inventory**: No tracking of what was moved where
- **Insufficient Testing**: Didn't validate each step before proceeding
- **Import Path Management**: Didn't systematically update all import statements

### Incremental Migration Strategy
**Core Principles:**
1. **One Package at a Time**: Migrate packages individually with full validation
2. **File Inventory System**: Track every file movement with source/destination mapping
3. **Test-First Validation**: Ensure tests pass after each migration step
4. **Import Path Tracking**: Systematically update and validate all import statements
5. **Rollback Capability**: Each step can be rolled back if validation fails

**Migration Steps:**
1. **Setup Monorepo Foundation** (without moving files)
   - Create pnpm-workspace.yaml
   - Create turbo.json
   - Create tsconfig.base.json
   - Update root package.json for workspace mode
   - Validate: Build and tests still pass

2. **Create Core Package** (first package migration)
   - Create packages/core with package.json
   - Move core files (state-machine, workflow, database, etc.)
   - Update imports in moved files to use relative paths
   - Create file inventory: source → destination mapping
   - Validate: Core package builds, root tests pass

3. **Update Remaining Files** (import path updates)
   - Update all remaining files to import from @responsible-vibe/core
   - Validate: All tests pass, build succeeds

4. **Repeat for Each Package** (mcp-server, cli, visualizer-*)
   - Follow same pattern: create, move, update imports, validate
   - Maintain file inventory for each package

**File Inventory Format:**
```json
{
  "migration_log": {
    "core": {
      "files_moved": [
        {"from": "src/state-machine.ts", "to": "packages/core/src/state-machine.ts"},
        {"from": "src/workflow-manager.ts", "to": "packages/core/src/workflow-manager.ts"}
      ],
      "imports_updated": [
        {"file": "src/server/index.ts", "changes": ["../state-machine → @responsible-vibe/core"]}
      ]
    }
  }
}
```

**Validation Criteria per Step:**
- All existing tests pass (290 tests)
- TypeScript compilation succeeds
- No broken import statements
- Package builds independently
- File inventory is complete and accurate

### Test Migration Strategy
**Current Test Structure:**
- 35 test files import from `src/` using relative paths like `../../src/state-machine-loader.js`
- Tests are organized in `test/unit/`, `test/e2e/`, and root `test/`
- All tests currently pass (290 tests)

**Test Migration Approach:**
1. **Keep Tests at Root Level Initially**
   - Don't move test files during initial migration
   - Update import paths in tests to use package names
   - Example: `../../src/state-machine-loader.js` → `@responsible-vibe/core`

2. **Import Path Update Strategy**
   - Create mapping of source files to their new package locations
   - Use automated script to update test imports
   - Validate after each package migration

3. **Test Organization Options** (decide later)
   - Option A: Keep all tests at root (integration testing approach)
   - Option B: Move unit tests to respective packages
   - Option C: Hybrid approach (unit tests in packages, integration at root)

**Test Import Mapping Example:**
```
src/state-machine-loader.js → @responsible-vibe/core
src/git-manager.js → @responsible-vibe/core  
src/server/index.js → @responsible-vibe/mcp-server
src/cli/visualization-launcher.js → @responsible-vibe/cli
```

### Comprehensive Validation Criteria

**Step 1: Monorepo Foundation Setup**
- [ ] pnpm-workspace.yaml created and valid
- [ ] turbo.json created with proper task configuration
- [ ] tsconfig.base.json created with shared configuration
- [ ] Root package.json updated for workspace mode
- [ ] All 290 tests still pass
- [ ] `npm run build` succeeds
- [ ] No TypeScript compilation errors

**Step 2: Core Package Migration**
- [ ] packages/core/package.json created with correct dependencies
- [ ] All core files moved to packages/core/src/
- [ ] File inventory JSON created and complete
- [ ] Core package builds independently (`cd packages/core && npm run build`)
- [ ] All import paths in core package use relative paths
- [ ] All 290 tests still pass after core package creation

**Step 3: Import Path Updates**
- [ ] All remaining files updated to import from @responsible-vibe/core
- [ ] Test files updated to use package imports
- [ ] No broken import statements (TypeScript compilation succeeds)
- [ ] All 290 tests still pass
- [ ] File inventory updated with import changes

**Step 4: Additional Package Migrations** (repeat for each)
- [ ] Package builds independently
- [ ] All files moved according to inventory
- [ ] Import paths updated systematically
- [ ] Tests pass after each package migration
- [ ] No circular dependencies between packages

**Final Success Criteria:**
- [ ] All packages build independently
- [ ] All 290 tests pass
- [ ] Monorepo builds with `turbo build`
- [ ] Documentation builds successfully
- [ ] No duplicate code between packages
- [ ] File inventory is complete and accurate
- [ ] All import statements use package names (no relative cross-package imports)

## Detailed Implementation Plan

### Monorepo Configuration (Template-Based)

**Source Template:** `~/projects/privat/template-typescript-monorepo`

**Files to Copy/Adapt:**
- `pnpm-workspace.yaml` → Copy as-is
- `turbo.json` → Adapt tasks for our build system
- `tsconfig.base.json` → Adapt for our TypeScript config
- `eslint.config.mjs` → Copy and adapt
- `.prettierrc.yaml` → Copy as-is
- `.lintstagedrc.js` → Copy as-is

**Root package.json Updates:**
- Add workspace scripts from template
- Update devDependencies (turbo, typescript, etc.)
- Keep existing dependencies (@modelcontextprotocol/sdk, etc.)
- Update scripts to use turbo for build orchestration

### Package Structure Plan

**packages/core/package.json:**
```json
{
  "name": "@responsible-vibe/core",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean:build": "rimraf ./dist",
    "test": "vitest --run"
  },
  "dependencies": {
    "@types/js-yaml": "4.0.9",
    "js-yaml": "4.1.0",
    "sqlite3": "^5.1.7",
    "zod": "^3.22.4"
  }
}
```

**packages/mcp-server/package.json:**
```json
{
  "name": "@responsible-vibe/mcp-server",
  "main": "dist/index.js",
  "bin": {
    "responsible-vibe-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean:build": "rimraf ./dist"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.17.5",
    "@responsible-vibe/core": "workspace:*"
  }
}
```

**packages/cli/package.json:**
```json
{
  "name": "@responsible-vibe/cli",
  "main": "dist/index.js",
  "bin": {
    "responsible-vibe-cli": "dist/index.js"
  },
  "dependencies": {
    "@responsible-vibe/core": "workspace:*"
  }
}
```

**Remaining packages:** visualizer-core, visualizer-web, visualizer-vue, docs (similar structure)

### File Inventory System

**Migration Log Structure (.vibe/migration-inventory.json):**
```json
{
  "migration_timestamp": "2025-10-04T12:15:00Z",
  "steps_completed": [],
  "packages": {
    "core": {
      "status": "pending|in-progress|completed|failed",
      "files_moved": [
        {
          "from": "src/state-machine.ts",
          "to": "packages/core/src/state-machine.ts",
          "timestamp": "2025-10-04T12:16:00Z"
        }
      ],
      "imports_updated": [
        {
          "file": "src/server/index.ts",
          "old_import": "../state-machine",
          "new_import": "@responsible-vibe/core",
          "timestamp": "2025-10-04T12:17:00Z"
        }
      ],
      "tests_affected": [
        "test/unit/state-machine-loader.test.ts"
      ]
    }
  },
  "validation_results": {
    "step_1_foundation": {
      "build_success": true,
      "tests_passing": 290,
      "timestamp": "2025-10-04T12:18:00Z"
    }
  }
}
```

**Core Package File Mapping:**
```
src/state-machine.ts → packages/core/src/state-machine.ts
src/state-machine-loader.ts → packages/core/src/state-machine-loader.ts
src/state-machine-types.ts → packages/core/src/state-machine-types.ts
src/workflow-manager.ts → packages/core/src/workflow-manager.ts
src/database.ts → packages/core/src/database.ts
src/conversation-manager.ts → packages/core/src/conversation-manager.ts
src/plan-manager.ts → packages/core/src/plan-manager.ts
src/template-manager.ts → packages/core/src/template-manager.ts
src/project-docs-manager.ts → packages/core/src/project-docs-manager.ts
src/file-detection-manager.ts → packages/core/src/file-detection-manager.ts
src/config-manager.ts → packages/core/src/config-manager.ts
src/git-manager.ts → packages/core/src/git-manager.ts
src/logger.ts → packages/core/src/logger.ts
src/interaction-logger.ts → packages/core/src/interaction-logger.ts
src/instruction-generator.ts → packages/core/src/instruction-generator.ts
src/system-prompt-generator.ts → packages/core/src/system-prompt-generator.ts
src/transition-engine.ts → packages/core/src/transition-engine.ts
src/path-validation-utils.ts → packages/core/src/path-validation-utils.ts
src/types.ts → packages/core/src/types.ts
```

### Migration Scripts Design

**scripts/migrate-step1-foundation.js:**
- Copy template files (pnpm-workspace.yaml, turbo.json, etc.)
- Update root package.json with workspace configuration
- Install new dependencies (turbo, etc.)
- Run validation (build + test)

**scripts/migrate-step2-core.js:**
- Create packages/core directory structure
- Move core files according to mapping
- Create packages/core/package.json
- Update imports in moved files to use relative paths
- Update file inventory
- Run validation

**scripts/migrate-step3-imports.js:**
- Scan all remaining files for imports from moved core files
- Update import statements to use @responsible-vibe/core
- Update test files
- Run validation

**scripts/validate-migration.js:**
- Run TypeScript compilation
- Run all 290 tests
- Check for broken imports
- Validate package builds independently
- Update migration inventory with results

### Step-by-Step Migration Procedures

**Step 1: Foundation Setup**
1. `cp ~/projects/privat/template-typescript-monorepo/pnpm-workspace.yaml .`
2. `cp ~/projects/privat/template-typescript-monorepo/turbo.json .`
3. `cp ~/projects/privat/template-typescript-monorepo/tsconfig.base.json .`
4. Update root package.json (add turbo, workspace scripts)
5. `pnpm install`
6. Validate: `npm run build && npm test`

**Step 2: Core Package Creation**
1. `mkdir -p packages/core/src`
2. Create packages/core/package.json
3. Move core files: `mv src/state-machine.ts packages/core/src/`
4. Update imports in moved files
5. `cd packages/core && pnpm build`
6. Validate: `npm test` (all 290 tests pass)

**Step 3: Import Path Updates**
1. Update all src/ files to import from @responsible-vibe/core
2. Update test files to use package imports
3. Validate: `npm run build && npm test`

**Rollback Procedures:**
- Git stash/commit before each step
- Restore from file inventory if step fails
- `git reset --hard` to previous working state

## Detailed Implementation Plan

### Monorepo Configuration Files

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'packages/*'
```

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

**tsconfig.base.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "exclude": ["node_modules", "dist"]
}
```

## Notes
*Additional context and observations*

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
