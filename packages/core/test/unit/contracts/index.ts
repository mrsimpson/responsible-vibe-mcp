/**
 * Interface Contract Test Framework
 *
 * Central export point for the contract testing framework.
 * Use this to import all necessary components for interface contract testing.
 */

// Core framework components
export {
  BaseInterfaceContract,
  ValidationHelpers,
  type MethodTestConfig,
  type ErrorTestConfig,
  type ImplementationRegistration,
} from './base-interface-contract.js';

// Implementation registry
export {
  ImplementationRegistry,
  RegisterImplementation,
  discoverAndRegisterImplementations,
} from './implementation-registry.js';

// Interface-specific contracts (these contain the actual test suites)
// Note: Import these test files directly to run the contract tests
// (empty exports removed per linter recommendations)

/**
 * Quick setup function to register all existing implementations
 * Call this at the start of your test suite to ensure coverage
 */
export async function setupContractTesting(): Promise<void> {
  const { discoverAndRegisterImplementations: discover } =
    await import('./implementation-registry.js');
  await discover();

  const { ImplementationRegistry: registry } =
    await import('./implementation-registry.js');
  const summary = registry.getRegistrationSummary();
  console.info('Contract test setup complete:', summary);
}

/**
 * Utility function to check if all required implementations are registered
 */
export function validateRegistrations(): {
  isComplete: boolean;
  missing: string[];
  registered: string[];
} {
  const { ImplementationRegistry } = require('./implementation-registry.js');
  const summary = ImplementationRegistry.getRegistrationSummary();

  // Define required implementations
  const requiredImplementations = {
    planManager: ['PlanManager'],
    instructionGenerator: ['InstructionGenerator'],
    taskBackendClient: [], // No implementations required yet
  };

  const missing: string[] = [];
  const registered: string[] = [];

  // Check plan managers
  for (const required of requiredImplementations.planManager) {
    if (summary.planManagers.includes(required)) {
      registered.push(`IPlanManager:${required}`);
    } else {
      missing.push(`IPlanManager:${required}`);
    }
  }

  // Check instruction generators
  for (const required of requiredImplementations.instructionGenerator) {
    if (summary.instructionGenerators.includes(required)) {
      registered.push(`IInstructionGenerator:${required}`);
    } else {
      missing.push(`IInstructionGenerator:${required}`);
    }
  }

  return {
    isComplete: missing.length === 0,
    missing,
    registered,
  };
}

/**
 * Get contract testing metrics
 */
export function getContractMetrics(): {
  totalImplementations: number;
  interfacesCovered: number;
  implementationsByInterface: Record<string, number>;
} {
  const { ImplementationRegistry } = require('./implementation-registry.js');
  const summary = ImplementationRegistry.getRegistrationSummary();

  return {
    totalImplementations: summary.total,
    interfacesCovered: 3, // IPlanManager, IInstructionGenerator, ITaskBackendClient
    implementationsByInterface: {
      IPlanManager: summary.planManagers.length,
      IInstructionGenerator: summary.instructionGenerators.length,
      ITaskBackendClient: summary.taskBackendClients.length,
    },
  };
}
