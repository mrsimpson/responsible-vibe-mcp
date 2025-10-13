# Development Plan: responsible-vibe (remove-useless-instructions-from-workflows branch)

*Generated on 2025-10-12 by Vibe Feature MCP*
*Workflow: [minor](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/minor)*

## Goal
Clean up `additional_instructions` in workflow configurations to only contain actionable one-time tasks for phase transitions, removing descriptive text that doesn't provide specific instructions.

## Phase Entrance Criteria

### Implement Phase
*Combined implementation phase - code, test, and commit*

**Enter when:**
- [x] Analysis of current additional_instructions is complete
- [x] Clear criteria defined for actionable vs descriptive instructions
- [x] Improvement plan documented
- [x] Specific examples identified and documented

### Finalize Phase
*Code cleanup and documentation finalization*

**Enter when:**
- [ ] All workflow files have been updated
- [ ] Changes tested and validated
- [ ] Documentation updated if needed

## Explore
### Phase Entrance Criteria:
- [x] Development workflow started

### Tasks
- [x] Examine current workflow configurations to identify problematic additional_instructions
- [x] Analyze patterns of non-actionable additional_instructions across workflows
- [x] Define criteria for what constitutes actionable vs descriptive instructions
- [x] Document specific examples of problematic instructions
- [x] Create improvement plan with specific changes needed

### Completed
- [x] Created development plan file

## Implement
### Phase Entrance Criteria:
- [x] Analysis of current additional_instructions is complete
- [x] Clear criteria defined for actionable vs descriptive instructions
- [x] Improvement plan documented

### Tasks
- [x] Clean up TDD workflow (already clean - no changes needed)
- [x] Update approach: Remove "Mark completed X tasks" from workflows (handled by proceed_to_phase)
- [x] Clean up Minor workflow - remove status/transition text (completed and tested)
- [x] Establish cleanup pattern and validate approach
- [x] Apply same pattern to remaining core workflows (EPCC, Waterfall, Greenfield, Bugfix)
- [x] Clean up non-code workflows (posts, slides, business-analysis, c4-analysis, big-bang-conversion, boundary-testing)
- [x] Update proceed_to_phase tool to automatically add "mark completed tasks" instruction
- [x] Test all workflow loading after changes
- [x] Validate no functionality is broken

### Completed
*None yet*

## Finalize
### Phase Entrance Criteria:
- [ ] All workflow files have been updated
- [ ] Changes tested and validated
- [ ] Documentation updated if needed

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
1. **Better approach identified**: Instead of "Mark completed X tasks" in additional_instructions, the `proceed_to_phase` tool should automatically handle task completion marking
2. **Criteria for actionable additional_instructions**: Must contain specific one-time actions like:
   - "Clean up any X artifacts" (cleanup)
   - "Set up X template/scaffolding" (scaffolding)  
   - "Focus on the specific Y that need Z" (targeted action)
3. **Criteria for removal**:
   - Status announcements: "X is complete! ✅"
   - Transition descriptions: "Now transition to Y phase"
   - Task completion instructions: "Mark completed X tasks" (handled by proceed_to_phase)
   - Motivational content: "You have a solid foundation"
   - Redundant information already in default_instructions

4. **Specific Examples to Fix**:

   **EPCC workflow - exploration_complete transition**:
   - Current: `'Exploration is complete! ✅ Now transition to planning phase. Present the plan to the user, describing the impact of the changes. Mark completed exploration tasks.'`
   - Should be: `'Mark completed exploration tasks.'`

   **Waterfall workflow - requirements_complete transition**:
   - Current: `'Requirements are complete! ✅ Now transition to design phase. Mark completed requirements tasks.'`
   - Should be: `'Mark completed requirements tasks.'`

   **Greenfield workflow - ideation_complete transition**:
   - Current: `'Ideation is complete! ✅ Present the PRD to the user. Mark completed ideation tasks.'`
   - Should be: `'Mark completed ideation tasks.'`

   **Minor workflow - exploration_complete transition**:
   - Current: `'Analysis and design complete! ✅ Now transition to implementation phase. You have a clear understanding of the problem and a solid design approach. Keep the scope focused on the minor enhancement. Mark completed exploration tasks.'`
   - Should be: `'Mark completed exploration tasks.'`

5. **Improvement Plan**:
   - **Phase 1**: Clean up simple cases (status announcements, transition descriptions)
   - **Phase 2**: Extract actionable parts from mixed instructions
   - **Phase 3**: Validate changes don't break workflow functionality
   - **Target workflows**: All 12 workflow files in resources/workflows/
   - **Estimated changes**: ~100+ additional_instructions to review and clean up

## Notes
- Found 100+ additional_instructions across all workflow files
- Most contain mix of actionable and descriptive content
- Common pattern: "X is complete! ✅ Now transition to Y phase. [actionable instruction]"
- TDD workflow has cleanest additional_instructions (mostly just "Mark completed X tasks")
- Waterfall and EPCC workflows have most verbose additional_instructions
- **COMPLETED**: All 12 workflow files cleaned up - removed status announcements, transition descriptions, and redundant prefixes while preserving actionable cleanup instructions

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
