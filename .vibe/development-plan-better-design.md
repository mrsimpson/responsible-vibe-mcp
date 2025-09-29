# Development Plan: responsible-vibe (better-design branch)

*Generated on 2025-09-28 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Improve the design document templates to focus on PRINCIPLES of how to create artifacts rather than referencing specific patterns or implementation files. Design documents should guide developers on the principles and approaches for creating artifacts, not reference actual implementation details.

## Explore
### Tasks
- [x] Analyze current design document templates and identify specific problems
- [x] Research principles-based design document best practices
- [x] Document examples of good vs bad design document content
- [x] Define clear requirements for improved templates

### Completed
- [x] Created development plan file
- [x] Located design document templates in resources/templates/design/
- [x] Examined current templates (comprehensive.md, freestyle.md, none.md)
- [x] Reviewed template manager implementation
- [x] Analyzed existing design.md example from project
- [x] Identified specific problems with current templates
- [x] Documented requirements for improved templates

## Plan

### Phase Entrance Criteria:
- [x] Current design document templates have been analyzed and problems identified
- [x] Requirements for principle-focused design documents are clearly defined
- [x] Template structure and content approach is understood
- [x] Examples of good vs bad design document content are documented

### Tasks
- [x] Design new template structure focusing on principles over implementation
- [x] Create content outline for comprehensive.md template replacement
- [x] Create content outline for freestyle.md template replacement  
- [x] Plan template instruction comments to guide LLMs toward principles-based content
- [x] Design template sections that encourage decision frameworks over specific solutions
- [x] Plan validation approach to ensure templates produce principle-based documents
- [x] Consider backward compatibility and migration strategy

### Completed
- [x] All planning tasks completed  
- [x] Detailed implementation strategy created
- [x] Template structure and content designed
- [x] Validation approach defined
- [x] Backward compatibility strategy planned

## Code

### Phase Entrance Criteria:
- [x] Implementation plan for template improvements is complete
- [x] New template content focusing on principles has been designed
- [x] Template structure and sections are defined
- [x] Approach for avoiding implementation references is established

### Tasks
- [x] Create new comprehensive.md template with principle-based structure and LLM guidance
- [x] Create new freestyle.md template with principle-based structure and LLM guidance  
- [x] Replace existing templates with new versions

### User Clarification - Better Separation of Concerns
**Key Insight**: Technology decisions should go in architecture documents, not design documents
- Architecture doc: Technology stack, frameworks, high-level system structure
- Design doc: How to design with those technologies, patterns, principles

**New Design Template Focus** (with tiered structure):
1. **Naming Conventions** - Design-level standards for readability
2. **Architecture Patterns & Principles** - SOLID, DRY, when to use which patterns
3. **Component Design Strategy** - Boundaries, responsibilities, interfaces
4. **Data Design Approach** - Domain objects, DTOs, modeling principles  
5. **Quality Attribute Implementation** - How design supports performance, security, etc.

**Tiered Structure by Project Complexity**:
- **Essential** (Startup/MVP): Sections 1-2 only
- **Core** (Small teams): Sections 1-4  
- **Advanced** (Enterprise): All sections
- **Specialized** (Mission-critical): All sections + specialized concerns

### New Tasks
- [x] Update comprehensive.md template to allow technology/framework references while avoiding concrete implementations
- [x] Update freestyle.md template with same balanced approach  
- [x] Redesign comprehensive.md with tiered structure focusing on design principles (not technology choices)
- [x] Redesign freestyle.md to complement the tiered approach
- [x] Remove technology stack sections from design templates (belongs in architecture)
- [x] Add guidance for project complexity levels within templates

### Completed
- [x] All initial implementation completed
- [x] User feedback received and analyzed
- [x] Templates updated with balanced approach allowing technology references while avoiding concrete implementations
- [x] Major redesign completed with tiered structure and proper design/architecture separation

## Commit

### Phase Entrance Criteria:
- [ ] New design document templates have been implemented
- [ ] Templates focus on principles rather than implementation details
- [ ] Templates have been tested and validated
- [ ] Documentation updates are complete

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

### New Template Structure Design

Based on the problems identified, the improved design document templates should follow this structure:

#### Core Principles Section
- Guide developers on fundamental design thinking
- Focus on decision-making frameworks rather than specific decisions
- Emphasize quality attributes and trade-offs

#### Design Philosophy Section  
- Document the "why" behind design approaches
- Provide guidance on when to apply different strategies
- Focus on principles that survive technology changes

#### Decision Frameworks Section
- Provide criteria for making architectural choices
- Guide future developers in similar scenarios
- Document trade-offs and evaluation approaches

#### Quality Attribute Guidelines
- Focus on maintainability, scalability, security principles
- Provide abstract guidance on achieving quality goals  
- Avoid specific technology recommendations

#### Abstract Pattern Guidelines
- Reference architectural patterns without naming specific implementations
- Use placeholder examples that illustrate concepts
- Guide thinking about pattern applicability

**Key Design Decisions for Templates:**
1. **No Technology References:** Templates will use abstract terms like "authentication mechanism" instead of "JWT"
2. **Principle-Based Instructions:** Comments will guide LLMs to focus on "how to think about" rather than "what to implement"
3. **Framework Focused:** Each section will provide decision-making frameworks rather than solutions
4. **Self-Contained:** No references to other documents or files
5. **Timeless Content:** Focus on principles that survive code changes

After analyzing the current design document templates, I've identified several issues:

**1. Implementation-Focused Rather Than Principle-Focused:**
- Current templates ask for "Implementation patterns", "concrete interfaces", "data models" 
- Templates guide LLMs to reference specific technologies and implementation details
- Example: "Technology Stack" section encourages listing specific tech choices rather than principles

**2. Reference to Actual Files:**
- Templates include references like "See [Architecture Document](./architecture.md)"
- This violates the principle that design docs should be self-contained principles

**3. Low-Level Implementation Details:**
- Current templates request "Methods, props, events, API" specifics
- Focus on "Implementation" sections rather than design principles
- Ask for specific "testing strategy" rather than testing principles

**4. Missing Principles-Based Content:**
- No guidance on design principles (e.g., SOLID, separation of concerns)
- No focus on "how to think about" creating artifacts
- No emphasis on decision-making frameworks

**5. Structure Encourages Wrong Content:**
- Sections like "Components and Interfaces" lead to specific implementation details
- "Data Models" section encourages schema definitions rather than data design principles
- Current structure guides toward "what to build" instead of "principles for building"

### Requirements for Improved Design Templates

Based on the analysis, the improved templates should:

1. **Focus on Principles:** Guide LLMs to document principles and approaches for artifact creation
2. **Avoid Implementation References:** Never reference actual files, patterns, or specific technologies
3. **Provide Decision Frameworks:** Include guidance on how to make design decisions
4. **Emphasize "Why" Over "What":** Focus on the reasoning and principles behind design choices
5. **Be Self-Contained:** Not reference other documents or specific project files
### Key Decision: Simplified Scope

**User clarified the actual requirement:**
- Simply need to provide templates that guide LLMs properly when reading them
- Focus on creating principle-based templates rather than implementation-focused ones
- No need for backwards compatibility concerns or validation frameworks
- Just replace the existing templates with better ones

**Simplified Approach:**
1. Create new comprehensive.md template with principle-focused content and instructions
2. Create new freestyle.md template with principle-focused content and instructions  
3. Replace the existing templates - that's it!

The templates themselves will guide the LLM through their instruction comments and section structure.

### Content Outline for Comprehensive.md Template Replacement

**New Template: principles-comprehensive.md**

```markdown
<!--
INSTRUCTIONS FOR LLM: DESIGN DOCUMENT (PRINCIPLES-COMPREHENSIVE)
- Document principles for creating artifacts, NOT what artifacts to create
- Focus on decision-making frameworks and "how to think about" problems
- Never reference specific technologies, files, or current implementations  
- Guide readers on approaches for making design choices
- Emphasize quality attributes and trade-offs in decision making
- Be self-contained - no links to other documents or project files
-->

# Design Principles Document

## Core Design Philosophy
<!-- Document the fundamental principles that guide all design decisions -->

## Decision-Making Frameworks
### Architectural Choice Criteria
<!-- How to evaluate different architectural approaches -->

### Quality Attribute Trade-offs  
<!-- Framework for balancing competing quality needs -->

### Pattern Selection Guidelines
<!-- Principles for choosing appropriate design patterns -->

## Component Design Principles
### Responsibility Assignment
<!-- Principles for determining what each component should handle -->

### Interface Design Philosophy  
<!-- Guidelines for creating clean, maintainable interfaces -->

### Dependency Management Approach
<!-- Principles for handling dependencies between components -->

## Data Design Philosophy
### Information Architecture Principles
<!-- How to think about structuring and organizing data -->

### Consistency and Integrity Guidelines
<!-- Principles for maintaining data quality -->

## Quality Attribute Guidelines
### Maintainability Principles
<!-- How to make design decisions that support long-term maintainability -->

### Performance Design Philosophy
<!-- Principles for making performance-conscious design decisions -->

### Security-by-Design Approach
<!-- How to integrate security thinking into design decisions -->

### Scalability Planning Principles
<!-- Guidelines for making design choices that support growth -->

## Testing Philosophy  
### Testability Design Principles
<!-- How to design for testability from the ground up -->

### Test Strategy Framework
<!-- Principles for determining what and how to test -->

## Error Handling Philosophy
### Resilience Design Principles  
<!-- How to think about building robust systems -->

### Failure Recovery Approaches
<!-- Principles for graceful degradation and recovery -->
```

### Content Outline for Freestyle.md Template Replacement

**New Template: principles-freestyle.md**

```markdown
<!--
INSTRUCTIONS FOR LLM: DESIGN DOCUMENT (PRINCIPLES-FREESTYLE)  
- Document design principles and decision-making approaches in your preferred format
- Focus on "how to think about" design challenges rather than specific solutions
- Never reference specific technologies, files, patterns, or implementations
- Guide developers on approaches to making good design decisions  
- Emphasize principles that will help with future similar decisions
- Keep it self-contained with no references to other documents
-->

# Design Principles Document

## Design Philosophy Overview
<!-- Your fundamental approach to making design decisions -->

## Key Decision-Making Principles  
<!-- The core principles you follow when faced with design choices -->

## Quality Attribute Approach
<!-- How you prioritize and balance different quality concerns -->

## Design Pattern Philosophy
<!-- Your approach to selecting and applying design patterns -->

## Implementation Guidance Principles
<!-- Principles that guide how designs should be translated to code -->
```

### Template Instruction Comments Strategy

**Key Principles for LLM Guidance Comments:**

1. **Explicit Prohibitions:** Clear "DO NOT" statements about what to avoid
   - "Never reference specific technologies or frameworks"
   - "Do not mention actual files, classes, or implementations"
   - "Avoid specific patterns - focus on pattern selection principles"

2. **Positive Direction:** Clear guidance on what TO focus on
   - "Document the decision-making criteria for choosing approaches"
   - "Focus on 'how to think about' rather than 'what to implement'"  
   - "Guide future developers facing similar design choices"

3. **Examples in Comments:** Provide good vs bad examples directly in instructions
   ```markdown
   <!-- GOOD: "Consider authentication lifecycle and token refresh strategies"
        BAD: "Use JWT tokens with 24-hour expiration" -->
   ```

4. **Quality Attribute Emphasis:** Guide toward trade-off thinking
   - "Focus on balancing competing quality attributes"
   - "Document the reasoning behind quality attribute priorities"

5. **Framework Orientation:** Guide toward providing decision frameworks
   - "Provide criteria for evaluating different approaches"  
   - "Document when and why to apply different strategies"

**Comment Placement Strategy:**
- Header comment with overall philosophy and prohibitions
- Section-level comments with specific guidance for that content type
- Inline examples showing good vs bad approaches
- Footer reminder about self-contained principle focus

### Template Sections That Encourage Decision Frameworks

**Section Design Principles:**

1. **Question-Based Section Headers:** Use headers that prompt framework thinking
   - Instead of: "Components and Interfaces"  
   - Use: "Component Responsibility Decision Framework"

2. **Framework-Prompting Content Structure:**
   ```markdown
   ## [Area] Decision Framework
   ### Evaluation Criteria
   <!-- What factors should guide decisions in this area -->
   
   ### Trade-off Analysis Approach  
   <!-- How to balance competing concerns -->
   
   ### Decision Guidelines
   <!-- When to choose different approaches -->
   
   ### Quality Considerations
   <!-- How decisions impact quality attributes -->
   ```

3. **Principle-Based Section Names:**
   - "Authentication Strategy Philosophy" (not "Authentication Implementation")  
   - "Data Consistency Principles" (not "Database Schema")
   - "Performance Design Approach" (not "Performance Optimizations")
   - "Error Handling Philosophy" (not "Error Handling Implementation")

4. **Guidance-Oriented Prompts:**
   - Each section starts with framework questions
   - Prompts for principle documentation
   - Encourages "how to think about" content

5. **Abstract Example Integration:**
   - Placeholder examples that illustrate concepts
   - Generic scenarios that demonstrate principles
   - No technology-specific examples

### Validation Approach for Principle-Based Templates

**Validation Criteria Checklist:**

1. **Content Analysis Checks:**
   - ❌ Contains specific technology names (JWT, React, SQL, etc.)
   - ❌ References actual files or implementations  
   - ❌ Mentions specific patterns by name (Singleton, Observer, etc.)
   - ❌ Includes specific API definitions or interfaces
   - ✅ Uses abstract terminology and concepts
   - ✅ Focuses on decision-making criteria
   - ✅ Provides framework for future decisions

2. **Structure Analysis:**  
   - ❌ Section headers mention implementation ("How to implement X")
   - ❌ Content asks for specific solutions  
   - ✅ Section headers focus on principles ("X Decision Framework")
   - ✅ Content prompts for approaches and criteria

3. **Template Testing Strategy:**
   - Test templates with sample prompts to generate example documents
   - Review generated content against validation criteria
   - Iterate template instructions based on generated output quality
   - Create "anti-examples" showing what NOT to produce

4. **User Feedback Integration:**
   - Test templates with developers to ensure they produce useful guidance
   - Validate that templates help with actual decision-making scenarios
   - Ensure templates provide enough structure without being prescriptive

**Implementation Testing Plan:**
- Create test scenarios with common design challenges
- Generate documents using new templates  
- Compare against current template outputs
- Validate improvement in principle-focus vs implementation-focus

### Backward Compatibility and Migration Strategy

**Compatibility Approach:**
1. **Replace Existing Templates:** Update comprehensive.md and freestyle.md with new principle-based versions
2. **Preserve Template Names:** Keep same filenames to avoid breaking existing workflows  
3. **Gradual Transition:** Users will automatically get improved templates in new projects
4. **Migration Documentation:** Provide guidance on updating existing design documents

**Migration Strategy for Existing Projects:**
- Existing design documents remain unchanged until manually updated
- New projects automatically use improved templates
- Optional migration guide for converting existing docs to principle-based format
- No breaking changes to template manager or project setup workflow

**Rollout Plan:**
1. Implement new templates alongside current ones for testing
2. Validate with test scenarios and user feedback  
3. Replace current templates with new versions
4. Monitor for any issues and iterate if needed
5. Document the improvement in project documentation

**Risk Mitigation:**
- Keep backups of original templates during transition
- Provide clear documentation about changes
- Ensure template manager handles new format correctly
- Test with various workflow scenarios before full deployment

## Notes

### Examples of Good vs Bad Design Document Content

**❌ Bad (Current Implementation-Focused Approach):**
```markdown
## Components and Interfaces
### UserService
- **Purpose:** Handle user authentication
- **Interface:** login(email, password), logout(), getCurrentUser()
- **Implementation:** Uses JWT tokens with Redis caching
```

**✅ Good (Principles-Based Approach):**
```markdown
## Authentication Design Principles
### Session Management Philosophy
- **Stateless by Design:** Authentication should not require server-side session storage
- **Token-Based Approach:** Use short-lived tokens with refresh mechanisms
- **Security First:** Always assume tokens can be compromised and design accordingly
- **User Experience:** Balance security with user convenience in session duration decisions
```

### Research on Design Document Best Practices

**Principles-based design documents should:**

1. **Focus on Decision-Making Frameworks**
   - Provide criteria for making choices rather than specific choices
   - Document the "why" behind architectural approaches
   - Guide future developers in similar decision scenarios

2. **Use Abstract Examples**
   - Reference patterns without naming specific technologies
   - Use placeholder examples that illustrate concepts
   - Avoid coupling to current implementation choices

3. **Emphasize Quality Attributes**
   - Focus on maintainability, scalability, security principles
   - Document trade-offs and decision criteria
   - Provide guidance on when to apply different approaches

4. **Self-Contained Guidance**
   - Each section should stand alone as guidance
   - No references to specific files or current implementations
   - Timeless principles that survive code changes

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
