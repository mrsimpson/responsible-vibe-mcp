# Development Plan: responsible-vibe (better-docs branch)

*Generated on 2025-09-27 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Make documentation handling more flexible by allowing workflows to optionally require or skip architecture, design, and requirements documents instead of making them mandatory in all workflows.

## Explore
### Tasks
- [x] Understand current documentation setup mechanism
- [x] Test current "none" template functionality 
- [x] Analyze specific workflow behavior with missing docs
- [x] Identify where mandatory doc setup blocks workflow start
- [x] Clarify user requirements for optional documentation
- [x] Design solution approach

### Completed
- [x] Created development plan file

## Plan

### Phase Entrance Criteria:
- [x] Current documentation handling mechanism is understood
- [x] User requirements for flexible documentation are clear
- [x] Existing workflows and their documentation needs are analyzed
- [x] Technical options for making docs optional are identified

### Tasks
- [x] Design workflow metadata schema for documentation requirements
- [x] Plan start-development handler modifications
- [x] Plan workflow instruction template updates 
- [x] Plan tool description improvements
- [x] Consider edge cases and backwards compatibility
- [x] Review impact on existing functionality

### Completed
*None yet*

## Code

### Phase Entrance Criteria:
- [x] Implementation strategy is defined and approved
- [x] Technical approach for optional docs is planned
- [x] Impact on existing workflows is assessed
- [x] User interface changes (if any) are specified

### Tasks
- [x] Update workflow schema to include requiresDocumentation field
- [x] Update greenfield, waterfall, c4-analysis workflows to set requiresDocumentation: true
- [x] Update other workflows with conditional document references
- [x] Modify start-development handler to respect requiresDocumentation flag
- [x] Update setup_project_docs tool descriptions to highlight "none" option
- [x] Run tests to ensure backwards compatibility
- [x] Test the new behavior with various workflows
- [x] Update test cases to verify both requiresDocumentation behaviors
- [x] Add critical test case: optional workflows can proceed with missing documents
- [x] Verify no TypeScript errors and all tests pass
- [x] **CODE QUALITY ISSUE IDENTIFIED**: Fix redundant handler existence checking pattern in server-config.ts

### Completed
- [x] All implementation tasks completed successfully
- [x] All tests passing including critical partial document availability test
- [x] Verified build process and TypeScript compilation successful
- [x] All 213 tests in test suite passing (no regressions detected)
- [x] Code quality improvement: Refactored repetitive handler checking pattern to use existing createToolHandler helper

## Commit

### Phase Entrance Criteria:
- [x] Optional documentation feature is implemented and working
- [x] Existing workflows are updated as needed
- [x] Tests pass and system is stable
- [x] Documentation reflects new flexibility

### Tasks
- [x] Review code quality and clean up any remaining issues
- [x] Verify final test coverage and documentation
- [x] Prepare commit message summarizing the feature implementation
- [x] Create final commit for the optional documentation feature

### Completed
- **Code Cleanup**: Verified no debug output or temporary code artifacts remain
- **Documentation Review**: Updated requirements.md, architecture.md, and design.md to reflect optional documentation feature
- **Final Validation**: Confirmed all 213 tests still pass, no regressions introduced
- **Final Commit**: Created commit 91a883d "feat: implement optional documentation for lightweight workflows" with comprehensive summary of the feature implementation

## Key Decisions
- Current system already has "none" templates (none.md) for all document types
- Templates create placeholders that instruct LLMs to use plan file instead
- "none" is already supported and works correctly when explicitly used
- ROOT CAUSE IDENTIFIED: start-development handler blocks workflow initiation if docs don't exist, forcing setup
- The handler returns 'artifact-setup' phase instead of starting the actual workflow
- USER REQUIREMENTS: Only greenfield, waterfall, c4-analysis should require docs
- Other workflows should reference docs conditionally with "If the $..._DOC exists, ..." pattern
- DECISION: Add `requiresDocumentation` boolean to workflow metadata (default: false)
- DECISION: Use minimal schema change to avoid breaking existing workflows
- TESTING CONFIRMED: Implementation working correctly - optional workflows now proceed directly to initial phase instead of blocking on missing docs
- TEST FIXES COMPLETED: Updated start-development-artifact-detection.test.ts to use correct test workflows - tests expecting blocking behavior now use requiredArchDoc/requiredMultipleDocs workflows, tests expecting non-blocking use optional workflows
- CRITICAL BUG FIXED: Test "should handle partial document availability correctly" was failing because the inline test workflow had requiresDocumentation: true at root level but our implementation checks metadata.requiresDocumentation - fixed test workflow structure to match our schema
- **PRE-EXISTING CODE QUALITY ISSUE**: server-config.ts has redundant handler existence checking pattern that should be refactored (not related to this feature)

## Notes
**Solution Approach:**

1. **Add workflow-level documentation requirements** to workflow metadata/schema
2. **Modify start-development handler** to check workflow requirements:
   - Workflows that require docs: greenfield, waterfall, c4-analysis → block until setup
   - Other workflows: allow start even with missing docs
3. **Update workflow instructions** for optional-doc workflows to use conditional references:
   - "If the $REQUIREMENTS_DOC exists, ensure requirements from $REQUIREMENTS_DOC are met"
   - Instead of: "Ensure requirements from $REQUIREMENTS_DOC are met"
4. **Update template suggestions** to include "none" as a visible option for optional workflows

**Technical Implementation Areas:**
- Workflow schema/metadata for doc requirements
- Start-development handler logic for conditional blocking
- Workflow instruction templates with conditional doc references
- Tool description updates for better UX

**Handler Modification Plan:**
- Check workflow.metadata.requiresDocumentation (defaults to false)
- If requiresDocumentation = false, skip artifact-setup phase
- Still provide document detection info but don't block workflow start
- Update guidance message to mention docs are optional for this workflow

**Workflow Instruction Updates:**
- Current: "Ensure requirements from $REQUIREMENTS_DOC are met"
- New: "If $REQUIREMENTS_DOC exists, ensure requirements from $REQUIREMENTS_DOC are met"
- Current: "document this in $ARCHITECTURE_DOC"
- New: "if $ARCHITECTURE_DOC exists, document this in $ARCHITECTURE_DOC, otherwise use plan file"
- Apply to all workflows except greenfield, waterfall, c4-analysis

**Tool Description Improvements:**
- Make "none" more visible in template suggestions
- Update start_development tool to mention optional docs for most workflows
- Clarify when docs are required vs optional in tool descriptions

**Edge Cases & Backwards Compatibility:**
- Existing workflows without requiresDocumentation → default to false (docs optional)
- Existing projects with docs already set up → no change in behavior
- Custom workflows → will default to optional docs (safer default)
- Users who manually create docs → still work as before
- Variable substitution → still works for conditional references

**Impact Analysis:**
- BREAKING CHANGES: None - all changes are additive
- NEW BEHAVIOR: Optional workflows won't block on missing docs
- PRESERVED BEHAVIOR: Required workflows still block (greenfield, waterfall, c4-analysis)
- TESTING REQUIRED: Start-development handler, workflow loading, variable substitution

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
