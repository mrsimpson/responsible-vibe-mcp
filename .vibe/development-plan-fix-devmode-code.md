# Development Plan: responsible-vibe (fix-devmode-code branch)

*Generated on 2026-03-03 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix docs dev mode failing with ESM import error for dayjs module. Error: "The requested module does not provide an export named 'default'" for dayjs/dayjs.min.js. Build works fine, only dev mode is affected. Related to UMD/ESM import compatibility.

## Reproduce
<!-- beads-phase-id: responsible-vibe-14.1 -->
### Tasks

*Tasks managed via `bd` CLI*

## Analyze
<!-- beads-phase-id: responsible-vibe-14.2 -->

### Phase Entrance Criteria:
- [ ] The bug has been successfully reproduced
- [ ] Error messages and stack traces have been collected
- [ ] Environment differences between dev and build modes are understood

### Tasks

*Tasks managed via `bd` CLI*

## Fix
<!-- beads-phase-id: responsible-vibe-14.3 -->

### Phase Entrance Criteria:
- [ ] Root cause has been identified
- [ ] The specific file/module causing the issue is known
- [ ] A solution approach has been determined

### Tasks

*Tasks managed via `bd` CLI*

## Verify
<!-- beads-phase-id: responsible-vibe-14.4 -->

### Phase Entrance Criteria:
- [ ] The fix has been implemented
- [ ] Code changes have been made to resolve the issue
- [ ] Dev mode starts without the ESM import error

### Tasks

*Tasks managed via `bd` CLI*

## Finalize
<!-- beads-phase-id: responsible-vibe-14.5 -->
### Tasks
- [ ] Squash WIP commits: `git reset --soft <first commit of this branch>. Then, Create a conventional commit. In the message, first summarize the intentions and key decisions from the development plan. Then, add a brief summary of the key changes and their side effects and dependencies

*Tasks managed via `bd` CLI*

## Key Decisions
- Identified that the issue is caused by mermaid's dependency on dayjs
- dayjs ships with a UMD build (dayjs.min.js) that doesn't provide proper ESM exports
- Vite dev mode fails when trying to import default from the minified UMD file
- Build works because the bundler can handle this during the build process
- dayjs has an ESM build available in `esm/index.js` directory
- **Solution chosen**: Add Vite resolve.alias configuration to point dayjs to its ESM build (dayjs/esm)
- This is the cleanest solution as it directly addresses the root cause
- **Additional issue found**: @braintree/sanitize-url (another mermaid dependency) also has CJS/ESM compatibility issues
- **Extended solution**: Added optimizeDeps.include for @braintree/sanitize-url and ssr.noExternal to handle CommonJS modules
- **Important**: Vite cache must be cleared after config changes for them to take effect

## Notes
- Error occurs in dev mode only: `The requested module '.../dayjs/dayjs.min.js' does not provide an export named 'default'`
- mermaid@11.12.2 depends on dayjs ^1.11.18
- The issue is specific to how Vite handles module resolution in dev mode vs build mode
- dayjs package.json points main to "dayjs.min.js" (UMD) instead of the ESM build
- VitePress allows Vite configuration through the `vite` option in config.ts
- Alternative solution would be optimizeDeps.include but alias is more explicit
- @braintree/sanitize-url is a CommonJS module that exports named exports
- Vite cache locations: `.vitepress/cache` and `node_modules/.vite`

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
