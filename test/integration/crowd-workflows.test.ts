/**
 * Crowd Workflows Tests
 *
 * Tests for multi-agent collaboration features:
 * - Role-based transition filtering
 * - $VIBE_ROLE variable substitution
 * - Role validation in proceed_to_phase
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  WorkflowManager,
  TransitionEngine,
  InstructionGenerator,
  PlanManager,
  ProjectDocsManager,
} from '@codemcp/workflows-core';

describe('Crowd Workflows', () => {
  let tempDir: string;
  let workflowManager: WorkflowManager;
  let transitionEngine: TransitionEngine;
  let planManager: PlanManager;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'crowd-workflow-test-'));
    workflowManager = new WorkflowManager();
    transitionEngine = new TransitionEngine(tempDir);
    planManager = new PlanManager();

    // Create .vibe directory
    mkdirSync(join(tempDir, '.vibe'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    // Clean up environment variable
    delete process.env['VIBE_ROLE'];
  });

  describe('Schema Extensions', () => {
    it('should parse workflow with role field on transitions', () => {
      const crowdWorkflow = `
name: 'test-crowd'
description: 'Test collaborative workflow'
initial_state: 'start'

metadata:
  domain: 'test'
  collaboration: true
  requiredRoles:
    - business-analyst
    - architect

states:
  start:
    description: 'Starting phase'
    default_instructions: 'Start phase instructions'
    transitions:
      - trigger: go_to_next
        to: next
        role: business-analyst
        additional_instructions: 'Instructions for BA'
        transition_reason: 'Moving to next'
      
      - trigger: go_to_next
        to: next
        role: architect
        additional_instructions: 'Instructions for architect'
        transition_reason: 'Moving to next'
  
  next:
    description: 'Next phase'
    default_instructions: 'Next phase instructions'
    transitions:
      - trigger: done
        to: next
        transition_reason: 'Complete'
`;

      writeFileSync(join(tempDir, '.vibe', 'workflow.yaml'), crowdWorkflow);

      // Enable the custom workflow in config
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - test-crowd\n`
      );

      const stateMachine = workflowManager.loadWorkflowForProject(
        tempDir,
        'test-crowd'
      );

      // Verify metadata
      expect(stateMachine.metadata?.collaboration).toBe(true);
      expect(stateMachine.metadata?.requiredRoles).toEqual([
        'business-analyst',
        'architect',
      ]);

      // Verify role field on transitions
      const startState = stateMachine.states['start'];
      expect(startState).toBeDefined();
      expect(startState.transitions).toHaveLength(2);
      expect(startState.transitions[0].role).toBe('business-analyst');
      expect(startState.transitions[1].role).toBe('architect');
    });

    it('should handle workflows without collaboration metadata', () => {
      const regularWorkflow = `
name: 'test-regular'
description: 'Regular single-agent workflow'
initial_state: 'start'

metadata:
  domain: 'test'

states:
  start:
    description: 'Starting phase'
    default_instructions: 'Start phase instructions'
    transitions:
      - trigger: go_to_next
        to: next
        transition_reason: 'Moving to next'
  
  next:
    description: 'Next phase'
    default_instructions: 'Next phase instructions'
    transitions:
      - trigger: done
        to: next
        transition_reason: 'Complete'
`;

      writeFileSync(join(tempDir, '.vibe', 'workflow.yaml'), regularWorkflow);

      // Enable the custom workflow in config
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - test-regular\n`
      );

      const stateMachine = workflowManager.loadWorkflowForProject(
        tempDir,
        'test-regular'
      );

      // Verify no collaboration metadata
      expect(stateMachine.metadata?.collaboration).toBeUndefined();
      expect(stateMachine.metadata?.requiredRoles).toBeUndefined();

      // Verify transitions have no role field
      const startState = stateMachine.states['start'];
      expect(startState).toBeDefined();
      expect(startState.transitions[0].role).toBeUndefined();
    });
  });

  describe('$VIBE_ROLE Variable Substitution', () => {
    it('should substitute $VIBE_ROLE in instructions', () => {
      process.env['VIBE_ROLE'] = 'business-analyst';

      const projectDocsManager = new ProjectDocsManager();
      const substitutions = projectDocsManager.getVariableSubstitutions(
        tempDir,
        'test-branch'
      );

      expect(substitutions['$VIBE_ROLE']).toBe('business-analyst');
    });

    it('should use empty string when VIBE_ROLE not set', () => {
      // Ensure VIBE_ROLE is not set
      delete process.env['VIBE_ROLE'];

      const projectDocsManager = new ProjectDocsManager();
      const substitutions = projectDocsManager.getVariableSubstitutions(
        tempDir,
        'test-branch'
      );

      expect(substitutions['$VIBE_ROLE']).toBe('');
    });

    it('should apply $VIBE_ROLE substitution in instructions', async () => {
      process.env['VIBE_ROLE'] = 'architect';

      // Create a simple workflow for the plan manager
      const simpleWorkflow = `
name: 'test-simple'
description: 'Simple test workflow'
initial_state: 'test'
metadata:
  domain: 'test'
states:
  test:
    description: 'Test phase'
    default_instructions: 'Test instructions'
    transitions:
      - trigger: done
        to: test
        transition_reason: 'Complete'
`;
      writeFileSync(join(tempDir, '.vibe', 'workflow.yaml'), simpleWorkflow);
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - test-simple\n`
      );

      const instructionGenerator = new InstructionGenerator(planManager);

      // Set the state machine so plan manager doesn't throw
      const stateMachine = workflowManager.loadWorkflowForProject(
        tempDir,
        'test-simple'
      );
      planManager.setStateMachine(stateMachine);
      instructionGenerator.setStateMachine(stateMachine);

      const instructionsWithRole =
        'You are $VIBE_ROLE working in a collaborative team.';

      const result = await instructionGenerator.generateInstructions(
        instructionsWithRole,
        {
          phase: 'test',
          conversationContext: {
            conversationId: 'test-conv',
            projectPath: tempDir,
            planFilePath: join(tempDir, '.vibe', 'plan.md'),
            gitBranch: 'test-branch',
            currentPhase: 'test',
            workflowName: 'test-simple',
          },
          transitionReason: 'Testing',
          isModeled: false,
          planFileExists: false,
        }
      );

      expect(result.instructions).toContain(
        'You are architect working in a collaborative team.'
      );
    });
  });

  describe('Transition Filtering', () => {
    it('should filter transitions by agent role', () => {
      const transitions = [
        {
          trigger: 'go',
          to: 'next',
          role: 'business-analyst',
          transition_reason: 'For BA',
        },
        {
          trigger: 'go',
          to: 'next',
          role: 'architect',
          transition_reason: 'For Architect',
        },
        {
          trigger: 'skip',
          to: 'end',
          transition_reason: 'For everyone',
        },
      ];

      // Filter for business-analyst
      const baTransitions = transitionEngine.filterTransitionsByRole(
        transitions,
        'business-analyst'
      );
      expect(baTransitions).toHaveLength(2);
      expect(baTransitions.some(t => t.role === 'business-analyst')).toBe(true);
      expect(baTransitions.some(t => !t.role)).toBe(true); // Includes role-less transition

      // Filter for architect
      const archTransitions = transitionEngine.filterTransitionsByRole(
        transitions,
        'architect'
      );
      expect(archTransitions).toHaveLength(2);
      expect(archTransitions.some(t => t.role === 'architect')).toBe(true);
      expect(archTransitions.some(t => !t.role)).toBe(true);

      // No role specified - return all
      const allTransitions = transitionEngine.filterTransitionsByRole(
        transitions,
        undefined
      );
      expect(allTransitions).toHaveLength(3);
    });

    it('should not filter transitions when agent role not specified', () => {
      const transitions = [
        {
          trigger: 'go',
          to: 'next',
          role: 'business-analyst',
          transition_reason: 'For BA',
        },
        {
          trigger: 'go',
          to: 'next',
          role: 'architect',
          transition_reason: 'For Architect',
        },
      ];

      const result = transitionEngine.filterTransitionsByRole(
        transitions,
        undefined
      );

      expect(result).toHaveLength(2);
      expect(result).toEqual(transitions);
    });
  });

  describe('Role Validation', () => {
    it('should allow transition when role matches', async () => {
      process.env['VIBE_ROLE'] = 'business-analyst';

      const crowdWorkflow = `
name: 'test-crowd'
description: 'Test collaborative workflow'
initial_state: 'start'

metadata:
  domain: 'test'
  collaboration: true
  requiredRoles:
    - business-analyst

states:
  start:
    description: 'Starting phase'
    default_instructions: 'Start phase instructions'
    transitions:
      - trigger: go_to_next
        to: next
        role: business-analyst
        additional_instructions: 'You are RESPONSIBLE for next phase'
        transition_reason: 'Moving to next'
  
  next:
    description: 'Next phase'
    default_instructions: 'Next phase instructions'
    transitions:
      - trigger: done
        to: next
        role: business-analyst
        additional_instructions: 'You are RESPONSIBLE'
        transition_reason: 'Complete'
`;

      writeFileSync(join(tempDir, '.vibe', 'workflow.yaml'), crowdWorkflow);
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - test-crowd\n`
      );

      const stateMachine = workflowManager.loadWorkflowForProject(
        tempDir,
        'test-crowd'
      );
      const startState = stateMachine.states['start'];
      expect(startState).toBeDefined();

      const transition = startState.transitions.find(
        t => t.to === 'next' && t.role === 'business-analyst'
      );

      // Verify transition exists for this role
      expect(transition).toBeDefined();
      expect(transition?.role).toBe('business-analyst');
    });

    it('should skip validation for non-collaborative workflows', async () => {
      process.env['VIBE_ROLE'] = 'business-analyst';

      const regularWorkflow = `
name: 'test-regular'
description: 'Regular workflow'
initial_state: 'start'

metadata:
  domain: 'test'

states:
  start:
    description: 'Starting phase'
    default_instructions: 'Start phase instructions'
    transitions:
      - trigger: go_to_next
        to: next
        transition_reason: 'Moving to next'
  
  next:
    description: 'Next phase'
    default_instructions: 'Next phase instructions'
    transitions:
      - trigger: done
        to: next
        transition_reason: 'Complete'
`;

      writeFileSync(join(tempDir, '.vibe', 'workflow.yaml'), regularWorkflow);
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - test-regular\n`
      );

      const stateMachine = workflowManager.loadWorkflowForProject(
        tempDir,
        'test-regular'
      );

      // Workflow has no collaboration metadata
      expect(stateMachine.metadata?.collaboration).toBeUndefined();

      // Transitions should not have role filtering
      const startState = stateMachine.states['start'];
      expect(startState).toBeDefined();
      expect(startState.transitions[0].role).toBeUndefined();
    });

    it('should skip validation when VIBE_ROLE not set', async () => {
      delete process.env['VIBE_ROLE'];

      const crowdWorkflow = `
name: 'test-crowd'
description: 'Test collaborative workflow'
initial_state: 'start'

metadata:
  domain: 'test'
  collaboration: true

states:
  start:
    description: 'Starting phase'
    default_instructions: 'Start phase instructions'
    transitions:
      - trigger: go_to_next
        to: next
        transition_reason: 'Moving to next'
  
  next:
    description: 'Next phase'
    default_instructions: 'Next phase instructions'
    transitions:
      - trigger: done
        to: next
        transition_reason: 'Complete'
`;

      writeFileSync(join(tempDir, '.vibe', 'workflow.yaml'), crowdWorkflow);
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - test-crowd\n`
      );

      const stateMachine = workflowManager.loadWorkflowForProject(
        tempDir,
        'test-crowd'
      );

      // Collaborative workflow but no VIBE_ROLE set
      expect(stateMachine.metadata?.collaboration).toBe(true);
      expect(process.env['VIBE_ROLE']).toBeUndefined();

      // Should work fine - transitions without role field work for everyone
      const startState = stateMachine.states['start'];
      expect(startState).toBeDefined();
      expect(startState.transitions[0].role).toBeUndefined();
    });
  });

  describe('Integration: Full Crowd Workflow', () => {
    it('should handle multi-role workflow with proper filtering', () => {
      const fullCrowdWorkflow = `
name: 'sdd-feature-crowd'
description: 'Collaborative feature development'
initial_state: 'analyze'

metadata:
  domain: 'sdd-crowd'
  collaboration: true
  requiredRoles:
    - business-analyst
    - architect
    - developer

states:
  analyze:
    description: 'Analyze requirements'
    default_instructions: 'You are $VIBE_ROLE in analyze phase'
    transitions:
      - trigger: analysis_complete
        to: specify
        role: business-analyst
        additional_instructions: 'You are RESPONSIBLE for specify'
        transition_reason: 'BA moves to specify'
      
      - trigger: analysis_complete
        to: specify
        role: architect
        additional_instructions: 'You are CONSULTED in specify'
        transition_reason: 'Architect consulted'
      
      - trigger: analysis_complete
        to: specify
        role: developer
        additional_instructions: 'You are CONSULTED in specify'
        transition_reason: 'Developer consulted'
  
  specify:
    description: 'Create specification'
    default_instructions: 'You are $VIBE_ROLE in specify phase'
    transitions:
      - trigger: spec_complete
        to: plan
        role: business-analyst
        additional_instructions: 'Hand off to architect'
        transition_reason: 'BA hands off'
      
      - trigger: spec_complete
        to: plan
        role: architect
        additional_instructions: 'You are RESPONSIBLE for plan'
        transition_reason: 'Architect takes lead'
      
      - trigger: spec_complete
        to: plan
        role: developer
        additional_instructions: 'Continue monitoring'
        transition_reason: 'Developer waits'
  
  plan:
    description: 'Create plan'
    default_instructions: 'You are $VIBE_ROLE in plan phase'
    transitions:
      - trigger: plan_complete
        to: plan
        transition_reason: 'Complete'
`;

      writeFileSync(join(tempDir, '.vibe', 'workflow.yaml'), fullCrowdWorkflow);
      writeFileSync(
        join(tempDir, '.vibe', 'config.yaml'),
        `enabled_workflows:\n  - sdd-feature-crowd\n`
      );

      const stateMachine = workflowManager.loadWorkflowForProject(
        tempDir,
        'sdd-feature-crowd'
      );

      // Verify workflow structure
      expect(stateMachine.name).toBe('sdd-feature-crowd');
      expect(stateMachine.metadata?.collaboration).toBe(true);
      expect(stateMachine.metadata?.requiredRoles).toHaveLength(3);

      // Test business-analyst view
      process.env['VIBE_ROLE'] = 'business-analyst';
      const analyzeState = stateMachine.states['analyze'];
      const baTransitions = transitionEngine.filterTransitionsByRole(
        analyzeState.transitions,
        'business-analyst'
      );
      expect(baTransitions).toHaveLength(1);
      expect(baTransitions[0].role).toBe('business-analyst');
      expect(baTransitions[0].additional_instructions).toContain('RESPONSIBLE');

      // Test architect view
      process.env['VIBE_ROLE'] = 'architect';
      const archTransitions = transitionEngine.filterTransitionsByRole(
        analyzeState.transitions,
        'architect'
      );
      expect(archTransitions).toHaveLength(1);
      expect(archTransitions[0].role).toBe('architect');
      expect(archTransitions[0].additional_instructions).toContain('CONSULTED');

      // Test developer view
      process.env['VIBE_ROLE'] = 'developer';
      const devTransitions = transitionEngine.filterTransitionsByRole(
        analyzeState.transitions,
        'developer'
      );
      expect(devTransitions).toHaveLength(1);
      expect(devTransitions[0].role).toBe('developer');
    });
  });
});
