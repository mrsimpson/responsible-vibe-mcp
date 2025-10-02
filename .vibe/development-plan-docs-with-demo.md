# Development Plan: responsible-vibe (docs-with-demo branch)

*Generated on 2025-10-02 by Vibe Feature MCP*
*Workflow: [minor](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/minor)*

## Goal
Enhance documentation (README.md and docs/readme) by adding an interactive demo with a placeholder image that opens a full-width overlay containing an iframe to the demo at https://agentic-rpl.netlify.app/conversation?url=https://github.com/mrsimpson/responsible-vibe-mcp/tree/demo-todo-greenfield/examples/greenfield-todo

## Explore
### Tasks
- [x] Analyze existing documentation structure (README.md and docs/README.md)
- [x] Confirm placeholder image exists at docs/images/placeholder-demo-greenfield.png
- [x] Identify VitePress as the documentation framework
- [x] Design HTML/CSS/JS solution for overlay functionality
- [x] Determine optimal placement for demo in both documentation files
- [x] Plan responsive design approach for overlay
- [x] Consider accessibility requirements for the interactive demo

### Completed
- [x] Created development plan file

## Implement

### Phase Entrance Criteria:
- [x] Requirements are clearly defined and documented
- [x] Technical approach is planned (HTML/CSS/JS for overlay functionality)
- [x] Existing documentation structure is analyzed
- [x] Placeholder image location is confirmed

### Tasks
- [x] Create HTML structure for demo component with play button overlay
- [x] Implement CSS for responsive design and modal functionality
- [x] Add JavaScript for modal open/close and keyboard navigation
- [x] Update root README.md with demo section
- [x] Update docs/README.md with demo section
- [x] Test functionality across different screen sizes
- [x] Verify accessibility features work correctly
- [x] Fix VitePress image path issue (use ./images/ prefix)
- [x] Convert to Vue component for VitePress compatibility
- [x] Simplify root README to use plain link with target="_blank"

### Completed
*None yet*

## Finalize

### Phase Entrance Criteria:
- [ ] Interactive demo functionality is implemented and working
- [ ] Documentation files are updated with the demo
- [ ] Overlay functionality is tested and responsive
- [ ] Code is clean and follows project standards

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions
- **Documentation Framework**: VitePress (TypeScript config)
- **Target Files**: README.md (root) and docs/README.md 
- **Placeholder Image**: docs/images/placeholder-demo-greenfield.png (confirmed exists)
- **Demo URL**: https://agentic-rpl.netlify.app/conversation?url=https://github.com/mrsimpson/responsible-vibe-mcp/tree/demo-todo-greenfield/examples/greenfield-todo
- **Approach**: HTML/CSS/JS overlay solution with play button over placeholder image
- **Implementation**: Inline styles for minimal dependencies, responsive design with max-width 600px
- **Accessibility**: ARIA labels, keyboard ESC support, focus management, proper alt text
- **Image Paths**: Relative paths adjusted for each README location (docs/ vs images/)
- **Cross-platform compatibility**: Simple link with target="_blank" for root README, Vue component for VitePress docs

## Notes
**Technical Approach:**
- Create a clickable container with the placeholder image and a centered play button overlay
- On click, show a full-screen modal with the iframe
- Use minimal CSS for styling (no external dependencies)
- Ensure responsive design for mobile/tablet
- Include close button (X) and ESC key support
- Lazy load the iframe only when opened for performance

**Placement Strategy:**
- Position after the "Quick Start" section in both README files
- Use a dedicated section like "## 🎬 See It In Action" 
- Keep consistent styling between root README and docs README

**Accessibility Considerations:**
- Proper ARIA labels for screen readers
- Keyboard navigation support
- Focus management when modal opens/closes
- Alt text for placeholder image

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
