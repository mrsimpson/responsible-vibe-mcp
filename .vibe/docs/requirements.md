<!-- 
INSTRUCTIONS FOR REQUIREMENTS (EARS FORMAT):
- Use EARS format
- Number requirements as REQ-1, REQ-2, etc.
- Keep user stories concise and focused on user value
- Make acceptance criteria specific and testable
- Reference requirements in tasks using: (_Requirements: REQ-1, REQ-3_)

EXAMPLE:
## REQ-1: User Authentication
**User Story:** As a website visitor, I want to create an account so that I can access personalized features.

**Acceptance Criteria:**
- WHEN user provides valid email and password THEN the system SHALL create new account
- WHEN user provides duplicate email THEN the system SHALL show "email already exists" error
- WHEN user provides weak password THEN the system SHALL show password strength requirements

FULL EARS SYNTAX:
While <optional pre-condition>, when <optional trigger>, the <system name> shall <system response>

The EARS ruleset states that a requirement must have: Zero or many preconditions; Zero or one trigger; One system name; One or many system responses.

The application of the EARS notation produces requirements in a small number of patterns, depending on the clauses that are used. The patterns are illustrated below.

Ubiquitous requirements
Ubiquitous requirements are always active (so there is no EARS keyword)

The <system name> shall <system response>

Example: The mobile phone shall have a mass of less than XX grams.

State driven requirements
State driven requirements are active as long as the specified state remains true and are denoted by the keyword While.

While <precondition(s)>, the <system name> shall <system response>

Example: While there is no card in the ATM, the ATM shall display “insert card to begin”.

Event driven requirements
Event driven requirements specify how a system must respond when a triggering event occurs and are denoted by the keyword When.

When <trigger>, the <system name> shall <system response>

Example: When “mute” is selected, the laptop shall suppress all audio output.

Optional feature requirements
Optional feature requirements apply in products or systems that include the specified feature and are denoted by the keyword Where.

Where <feature is included>, the <system name> shall <system response>

Example: Where the car has a sunroof, the car shall have a sunroof control panel on the driver door.

Unwanted behavior requirements
Unwanted behavior requirements are used to specify the required system response to undesired situations and are denoted by the keywords If and Then.

If <trigger>, then the <system name> shall <system response>

Example: If an invalid credit card number is entered, then the website shall display “please re-enter credit card details”.

Complex requirements
The simple building blocks of the EARS patterns described above can be combined to specify requirements for richer system behavior. Requirements that include more than one EARS keyword are called Complex requirements.

While <precondition(s)>, When <trigger>, the <system name> shall <system response>

Example: While the aircraft is on ground, when reverse thrust is commanded, the engine control system shall enable reverse thrust.

Complex requirements for unwanted behavior also include the If-Then keywords.
-->

# Requirements Document

## REQ-1: Optional Documentation for Workflows
**User Story:** As a developer using lightweight workflows, I want to skip formal documentation setup when it's not necessary so that I can start development immediately without unnecessary overhead.

**Acceptance Criteria:**
- WHEN using lightweight workflows (epcc, minor, bugfix) THEN the system SHALL allow skipping documentation setup
- WHEN using comprehensive workflows (greenfield, waterfall, c4-analysis) THEN the system SHALL still require documentation setup
- WHEN documentation is optional THEN workflow instructions SHALL reference docs conditionally using "If $DOC exists..." patterns
- WHEN documentation is required THEN workflow initiation SHALL be blocked until documents exist

## REQ-2: Workflow-Specific Documentation Requirements
**User Story:** As a workflow designer, I want to specify whether my workflow requires formal documentation so that users get appropriate guidance for their development approach.

**Acceptance Criteria:**
- WHEN defining a workflow THEN the system SHALL support a requiresDocumentation metadata flag
- WHEN requiresDocumentation is true THEN the system SHALL enforce document setup before workflow start
- WHEN requiresDocumentation is false or undefined THEN the system SHALL proceed directly to development without document checks
- WHEN no metadata is specified THEN the system SHALL default to optional documentation (requiresDocumentation: false)

## REQ-3: Backward Compatibility
**User Story:** As a system maintainer, I want the optional documentation feature to be backward compatible so that existing workflows continue to work without modification.

**Acceptance Criteria:**
- WHEN existing workflows have no requiresDocumentation metadata THEN the system SHALL default to optional documentation
- WHEN new metadata is added THEN the system SHALL not break existing workflow definitions
- WHEN documentation requirements change THEN all existing tool interfaces SHALL remain functional

## REQ-4: Conditional Documentation References
**User Story:** As a workflow author, I want to reference documentation conditionally so that workflows can adapt to whether documents exist or not.

**Acceptance Criteria:**
- WHEN workflows reference documentation THEN instructions SHALL use conditional patterns like "If the $ARCHITECTURE_DOC exists..."
- WHEN documents don't exist THEN workflows SHALL provide alternative guidance using plan file instead
- WHEN documents exist THEN workflows SHALL reference them normally in instructions
