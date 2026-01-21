# Development Plan: responsible-vibe (fix-workflow-state-click branch)

*Generated on 2026-01-21 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix the workflow visualizer bug where workflow states are not clickable anymore. Restore the clickability functionality for workflow states in the visualizer interface.

## Reproduce
<!-- beads-phase-id: responsible-vibe-5.1 -->

### Phase Entrance Criteria:
- [x] The bug has been successfully reproduced
- [x] The exact conditions and steps to trigger the bug are documented
- [x] Test cases demonstrating the problem have been created
- [x] Environment details and affected components are identified

### Tasks

*Tasks managed via `bd` CLI*

## Analyze
<!-- beads-phase-id: responsible-vibe-5.2 -->

### Phase Entrance Criteria:
- [x] Root cause of the bug has been identified and documented
- [x] The problematic code paths have been analyzed
- [x] The why and when of the bug occurrence is understood
- [x] Impact assessment and blast radius have been evaluated

### Tasks

*Tasks managed via `bd` CLI*

## Fix
<!-- beads-phase-id: responsible-vibe-5.3 -->

### Phase Entrance Criteria:
- [x] The bug fix has been implemented
- [x] Code changes address the identified root cause
- [x] Implementation follows best practices and doesn't introduce new risks
- [x] Fix is ready for testing and validation

### Tasks

*Tasks managed via `bd` CLI*

## Verify
<!-- beads-phase-id: responsible-vibe-5.4 -->

### Phase Entrance Criteria:
- [ ] The bug fix has been implemented
- [ ] Code changes address the identified root cause
- [ ] Implementation follows best practices and doesn't introduce new risks
- [ ] Fix is ready for testing and validation

### Tasks

*Tasks managed via `bd` CLI*

## Finalize
<!-- beads-phase-id: responsible-vibe-5.5 -->

### Phase Entrance Criteria:
- [x] The bug fix has been verified to work correctly
- [x] No regressions have been introduced by the fix
- [x] All tests pass and the solution is robust
- [x] Fix resolves the original issue completely

### Tasks

*Tasks managed via `bd` CLI*

## Key Decisions
### Root Cause Analysis Complete:
**Decision**: SVG structure mismatch is the definitive root cause of the clickability issue.

**Technical Details**:
1. **State Event Binding Failure**: PlantUMLRenderer expects `g[id="stateName"]` but actual PlantUML SVG generates `g[id=""]`
2. **Transition Event Binding Failure**: Code expects `g.link[id^="link_"]` but PlantUML generates `g.link[id="lnkN"]`
3. **Impact**: No event handlers can be attached, resulting in completely non-interactive workflow diagrams

**Next Steps**: Need to choose between:
- Option A: Update PlantUML generation to produce expected ID patterns
- Option B: Update PlantUMLRenderer selectors to match actual SVG structure (recommended for lower risk)

**Final Decision**: Chose Option B - Updated PlantUMLRenderer selectors for lower risk and faster implementation.

**Critical Discovery**: Investigation revealed that **workflow visualizer clickability was never actually working**. The original implementation from commit 7e4a10d had the same flawed assumption about PlantUML SVG structure. This is not a regression but implementing the feature correctly for the first time.

**Implementation Details**:
1. **State Fix**: Changed from `g[id="stateName"]` selector to finding `text` elements with state name content, then getting parent `g` element
   - Added comprehensive comments explaining PlantUML SVG structure assumptions
   - Strategy: Text-first detection with DOM traversal to parent group
2. **Transition Fix**: Changed from `g.link[id^="link_"]` to `g.link[id^="lnk"]` and match transitions by text content analysis
   - Added comprehensive comments explaining ID pattern mismatch and fuzzy matching strategy
   - Strategy: Label text extraction and fuzzy matching against workflow transition data
3. **Risk Mitigation**: Minimal code changes, preserved existing functionality, added proper TypeScript type handling
4. **Documentation**: Added detailed comments in helper methods explaining detection strategies and why they work

## Notes
### Environment Details Collected:
- **System**: macOS (based on file paths)
- **Visualizer Location**: `packages/docs` directory (VitePress site)  
- **Development Server**: `http://localhost:5173/responsible-vibe-mcp/`
- **Visualizer Technology**: Vue 3 component using PlantUML SVG generation with D3.js for interactivity
- **Click Handler Implementation**: Located in `packages/visualizer/src/visualization/PlantUMLRenderer.ts` and `packages/visualizer/src/WorkflowVisualizer.vue`

### Code Analysis:
The workflow visualizer generates PlantUML SVGs and adds JavaScript click event listeners to SVG elements:
1. **States**: Click handlers added to `<g>` elements with state IDs (line 304-311 in PlantUMLRenderer.ts)
2. **Transitions**: Click handlers added to link groups with pattern `link_<source>_<target>` (line 360-387)
3. **Event Handling**: Uses `onElementClick` callback to trigger state/transition selection

### Reproduction Status:
- ✅ Development server started successfully at `http://localhost:5173/responsible-vibe-mcp/`
- ✅ **Bug Confirmed**: All workflow states and transitions are not clickable
- ✅ **Root Cause Identified**: SVG elements have no click event handlers attached (`hasClick: false`)

### Key Findings from Playwright Analysis:
- **Affected Elements**: All states (text elements) and transitions (g.link elements) across all workflows
- **Behavior**: Elements render visually but are completely non-interactive
- **Console**: No JavaScript errors related to event handling, Vue components mount successfully  
- **Expected vs Actual**: Should show details in right panel when clicked, but no response occurs
- **Technical Issue**: SVG event handlers are not being properly attached during Vue rendering process

### SVG Structure Mismatch Analysis:
**PlantUMLRenderer Expected vs Actual SVG Structure:**

**State Elements - MISMATCH IDENTIFIED:**
- **Expected**: `g[id]` elements where `id` matches state names (e.g., "reproduce", "analyze", "fix", "verify")
- **Actual**: State `<g>` elements have **empty IDs** (`id=""`)
- **Impact**: `svgElement.querySelectorAll('g[id]')` finds 17 elements, but none have the expected state name IDs
- **State Content**: State names exist as `<text>` elements within unnamed `<g>` containers

**Transition Elements - PARTIAL MISMATCH:**
- **Expected**: `g.link[id^="link_"]` with pattern `link_<source>_<target>`
- **Actual**: `g.link` elements exist with IDs like "lnk3", "lnk4", etc., NOT "link_reproduce_analyze"
- **Impact**: `svgElement.querySelectorAll('g.link[id^="link_"]')` returns 0 elements
- **Available**: 17 `g.link` elements with IDs like `lnk3`, `lnk4`, etc.

**Root Cause Summary:**
1. **State selectors fail**: No `<g>` elements have state name IDs ("reproduce", "analyze", etc.)
2. **Transition selectors fail**: Link IDs use "lnk" prefix instead of expected "link_" prefix
3. **Result**: Event handlers cannot be attached to any interactive elements

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
