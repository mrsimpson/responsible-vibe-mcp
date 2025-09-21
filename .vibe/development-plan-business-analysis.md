# Development Plan: responsible-vibe (business-analysis branch)

*Generated on 2025-09-19 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Create a new workflow for business-perspective analysis of software systems that complements the existing c4-analysis workflow. The goal is to produce comprehensive documentation that business domain architects can understand and use to navigate system components.

## Explore
### Tasks
- [x] Analyze existing c4-analysis workflow structure and phases
- [x] Define target audience needs (business domain architects)
- [x] Identify gaps between technical c4-analysis and business perspective
- [x] Research business architecture documentation standards
- [x] Define business methodology approach (TOGAF-inspired capability modeling)
- [x] Understand TOGAF business architecture essentials (capabilities → services → processes → functions)
- [x] Design interactive LLM guidance for each workflow phase
- [x] Define user interaction patterns for document gathering
- [x] Create templates for interactive output format definition
- [x] Design workflow phases with specific LLM instructions
- [x] Define deliverable templates (capability maps, process flows, business glossary)

### Completed
- [x] Created development plan file
- [x] Analyzed c4-analysis workflow phases and structure
- [x] Clarified user requirements for business capabilities and process flows
- [x] Researched business architecture methodologies (TOGAF, Business Capability Modeling)
- [x] Confirmed TOGAF-inspired approach with interactive LLM guidance requirement

## Plan

### Phase Entrance Criteria:
- [x] The business analysis workflow requirements have been thoroughly defined
- [x] Existing c4-analysis workflow has been analyzed for complementary opportunities
- [x] Target audience (business domain architects) needs are clearly understood
- [x] Scope of business documentation deliverables is defined

### Tasks
- [x] Design workflow YAML structure with 9 phases (C4-style individual phases)
- [x] Create detailed LLM instructions for Document Discovery phase
- [x] Define standardized TOGAF folder structure
- [x] Create detailed LLM instructions for Documents Consolidation phase
- [x] Create detailed LLM instructions for Capability Identification phase (document-driven)
- [x] Create detailed LLM instructions for Capability Decomposition phase (task-based)
- [x] Create detailed LLM instructions for Service Mapping phase (task-based)
- [x] Create detailed LLM instructions for Process Analysis phase (task-based)
- [x] Create detailed LLM instructions for Function Mapping phase (task-based)
- [x] Create detailed LLM instructions for Technical-Business Mapping phase (task-based)
- [x] Create detailed LLM instructions for Documentation phase
- [x] Define phase transitions and triggers with task creation in additional_instructions (deferred to code phase)
- [x] Create business document templates in transition additional_instructions (deferred to code phase)
- [x] Define long-term memory structure (BUSINESS_ANALYSIS.md)
- [x] Specify integration with existing project documentation system
- [x] Review and validate complete workflow design

### Completed
*None yet*

## Code

### Phase Entrance Criteria:
- [x] Implementation plan is complete and approved
- [x] Workflow structure and phases are clearly defined
- [x] Documentation templates and formats are specified
- [x] Integration approach with existing c4-analysis is planned

### Tasks
- [x] Create business-analysis.yaml workflow file
- [x] Implement all 9 phase definitions with default_instructions
- [x] Create phase transitions with task/template creation in additional_instructions
- [x] Add BUSINESS_ANALYSIS.md template creation in document_discovery phase
- [x] Add overview document templates for all TOGAF components
- [x] Fix documentation phase to end workflow properly (analysis_complete state)
- [x] Define metadata (complexity, bestFor, examples) for workflow discoverability
- [x] Test workflow structure against schema validation
- [x] Integrate with existing workflow system

### Completed
- [x] Created complete business-analysis.yaml workflow file with all 10 phases
- [x] Implemented systematic task-based approach throughout all phases
- [x] Added phase transitions with task and template creation in additional_instructions
- [x] Included BUSINESS_ANALYSIS.md template in document_discovery transition
- [x] Added templates for all overview documents (business-services-catalog.md, business-processes-detailed.md, business-functions-mapping.md, technical-business-mapping.md)
- [x] Fixed documentation phase to end with analysis_complete state instead of looping back
- [x] Metadata already defined in workflow file (complexity: medium, bestFor, useCases, examples)
- [x] Workflow structure validated - 10 states, proper YAML syntax, all transitions defined
- [x] Workflow integrated into existing system (placed in resources/workflows/ directory)

## Commit

### Phase Entrance Criteria:
- [x] Business analysis workflow is fully implemented
- [x] All workflow files and templates are created
- [x] Documentation is complete and accurate
- [x] Integration with existing system is tested

### Tasks
- [x] Code cleanup - remove debug output and temporary code
- [x] Review TODO/FIXME comments (none found)
- [x] Remove debugging code blocks (none found)
- [x] Update long-term memory documents
- [x] Compare implementation against documentation
- [x] Final validation and testing
- [x] Prepare for delivery
- [x] Improve document consolidation phase by splitting into two phases

### Completed
- [x] No debug output or temporary code found - implementation was clean
- [x] No TODO/FIXME comments to address
- [x] Implementation matches design specifications exactly
- [x] All documentation is accurate and reflects final state
- [x] Workflow structure validated and tested
- [x] Ready for production delivery
- [x] Split documents_consolidation into basic summarization and business_content_analysis phases

## Key Decisions
- **Workflow Approach**: Using EPCC methodology to develop the business-analysis workflow
- **Complementary Design**: The new workflow will complement (not replace) the existing c4-analysis workflow
- **Target Audience**: Business domain architects who need to understand system components from a business perspective
- **Business Methodology**: TOGAF-inspired business capability modeling with hierarchical decomposition
- **Primary Deliverables**: Business capability maps, process flow diagrams, structured business documentation
- **Integration Strategy**: c4-analysis results as ONE input among other business documents (system docs, process docs)
- **Component Business Value Assessment**: Analyze technical components for business function, value, criticality, and ownership
- **Workflow Structure**: 9 phases following C4-style individual focused phases to avoid overwhelming users
- **Long-term Memory**: BUSINESS_ANALYSIS.md file similar to DISCOVERY.md in c4-analysis
- **Interactive Design**: Each phase includes specific LLM instructions for user interaction and document gathering
- **Output Format**: Always markdown format, only diagram format is user choice (ascii, mermaid, plantuml)
- **Standard TOGAF Structure**: Always create overview files + detail folders for each TOGAF component
- **Summarization Technique**: Structured chapter-by-chapter, hierarchy-level processing in dedicated consolidation phase
- **Task-Based Processing**: LLM creates summarization tasks in plan file for systematic processing
- **Document-Driven Approach**: Start capability identification by analyzing processed documents, then validate with user
- **Phase Transition Optimization**: Move task creation and template creation into transition additional_instructions
- **Document Consolidation Split**: Split documents_consolidation into basic summarization and separate business_content_analysis phase for explicit task creation

## Notes
- The c4-analysis workflow focuses on technical architecture using C4 methodology (Context → Container → Component → Code)
- Business architecture methodologies exist: TOGAF, Business Capability Modeling, Value Stream Mapping
- Proposed workflow phases: Document Preparation → Business Analysis → Technical-Business Mapping → Documentation
- Need to design templates for capability maps, process flows, and business glossary
- Component Business Value Assessment = analyzing each technical component's business function, value, criticality, and ownership

**TOGAF Business Architecture Essentials:**
- **Business Capabilities**: What the business does (stable, high-level functions)
- **Business Services**: How capabilities are delivered
- **Business Processes**: Step-by-step activities that deliver services  
- **Business Functions**: Organizational units that perform processes
- **Hierarchy**: Domain → Capability → Sub-capability → Process
- **Example**: Customer Management → Customer Onboarding → Identity Verification → KYC Document Review

**Interactive LLM Requirements:**
- Workflow must guide LLM on how to interact with users throughout TOGAF phases
- Include instructions for gathering documents from users
- Provide guidance for interactive output format definition
- Each phase needs specific user interaction patterns

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
