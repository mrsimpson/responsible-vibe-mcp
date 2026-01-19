/**
 * Implementation Registry
 *
 * Central registry for interface implementations to ensure all implementations
 * are tested against their interface contracts.
 */

import type { ImplementationRegistration } from './base-interface-contract.js';
import type { IPlanManager } from '../../../src/interfaces/plan-manager.interface.js';
import type { IInstructionGenerator } from '../../../src/interfaces/instruction-generator.interface.js';
import type { ITaskBackendClient } from '../../../src/interfaces/task-backend-client.interface.js';

/**
 * Registry for all interface implementations
 */
export class ImplementationRegistry {
  private static planManagerImplementations = new Map<
    string,
    ImplementationRegistration<IPlanManager>
  >();
  private static instructionGeneratorImplementations = new Map<
    string,
    ImplementationRegistration<IInstructionGenerator>
  >();
  private static taskBackendClientImplementations = new Map<
    string,
    ImplementationRegistration<ITaskBackendClient>
  >();

  /**
   * Register a PlanManager implementation
   */
  static registerPlanManager(
    registration: ImplementationRegistration<IPlanManager>
  ): void {
    this.planManagerImplementations.set(registration.name, registration);
  }

  /**
   * Register an InstructionGenerator implementation
   */
  static registerInstructionGenerator(
    registration: ImplementationRegistration<IInstructionGenerator>
  ): void {
    this.instructionGeneratorImplementations.set(
      registration.name,
      registration
    );
  }

  /**
   * Register a TaskBackendClient implementation
   */
  static registerTaskBackendClient(
    registration: ImplementationRegistration<ITaskBackendClient>
  ): void {
    this.taskBackendClientImplementations.set(registration.name, registration);
  }

  /**
   * Get all registered PlanManager implementations
   */
  static getPlanManagerImplementations(): ImplementationRegistration<IPlanManager>[] {
    return Array.from(this.planManagerImplementations.values());
  }

  /**
   * Get all registered InstructionGenerator implementations
   */
  static getInstructionGeneratorImplementations(): ImplementationRegistration<IInstructionGenerator>[] {
    return Array.from(this.instructionGeneratorImplementations.values());
  }

  /**
   * Get all registered TaskBackendClient implementations
   */
  static getTaskBackendClientImplementations(): ImplementationRegistration<ITaskBackendClient>[] {
    return Array.from(this.taskBackendClientImplementations.values());
  }

  /**
   * Clear all registrations (useful for testing)
   */
  static clearAll(): void {
    this.planManagerImplementations.clear();
    this.instructionGeneratorImplementations.clear();
    this.taskBackendClientImplementations.clear();
  }

  /**
   * Check if an implementation is registered
   */
  static isRegistered(
    interfaceType:
      | 'plan-manager'
      | 'instruction-generator'
      | 'task-backend-client',
    name: string
  ): boolean {
    switch (interfaceType) {
      case 'plan-manager':
        return this.planManagerImplementations.has(name);
      case 'instruction-generator':
        return this.instructionGeneratorImplementations.has(name);
      case 'task-backend-client':
        return this.taskBackendClientImplementations.has(name);
      default:
        return false;
    }
  }

  /**
   * Get registration by name and type
   */
  static getRegistration<T>(
    interfaceType:
      | 'plan-manager'
      | 'instruction-generator'
      | 'task-backend-client',
    name: string
  ): ImplementationRegistration<T> | undefined {
    switch (interfaceType) {
      case 'plan-manager':
        return this.planManagerImplementations.get(name) as
          | ImplementationRegistration<T>
          | undefined;
      case 'instruction-generator':
        return this.instructionGeneratorImplementations.get(name) as
          | ImplementationRegistration<T>
          | undefined;
      case 'task-backend-client':
        return this.taskBackendClientImplementations.get(name) as
          | ImplementationRegistration<T>
          | undefined;
      default:
        return undefined;
    }
  }

  /**
   * Get summary of all registered implementations
   */
  static getRegistrationSummary(): {
    planManagers: string[];
    instructionGenerators: string[];
    taskBackendClients: string[];
    total: number;
  } {
    const planManagers = Array.from(this.planManagerImplementations.keys());
    const instructionGenerators = Array.from(
      this.instructionGeneratorImplementations.keys()
    );
    const taskBackendClients = Array.from(
      this.taskBackendClientImplementations.keys()
    );

    return {
      planManagers,
      instructionGenerators,
      taskBackendClients,
      total:
        planManagers.length +
        instructionGenerators.length +
        taskBackendClients.length,
    };
  }
}

/**
 * Helper decorator to automatically register implementations
 */
export function RegisterImplementation<T>(
  interfaceType:
    | 'plan-manager'
    | 'instruction-generator'
    | 'task-backend-client',
  registration: Omit<ImplementationRegistration<T>, 'createInstance'>
) {
  return function (constructor: new (...args: unknown[]) => T) {
    const fullRegistration: ImplementationRegistration<T> = {
      ...registration,
      createInstance: () => new constructor(),
    };

    switch (interfaceType) {
      case 'plan-manager':
        ImplementationRegistry.registerPlanManager(
          fullRegistration as unknown as ImplementationRegistration<IPlanManager>
        );
        break;
      case 'instruction-generator':
        ImplementationRegistry.registerInstructionGenerator(
          fullRegistration as unknown as ImplementationRegistration<IInstructionGenerator>
        );
        break;
      case 'task-backend-client':
        ImplementationRegistry.registerTaskBackendClient(
          fullRegistration as unknown as ImplementationRegistration<ITaskBackendClient>
        );
        break;
    }
  };
}

/**
 * Auto-discovery function to register all implementations
 * Call this at the start of your test suite to ensure all implementations are registered
 */
export async function discoverAndRegisterImplementations(): Promise<void> {
  // This function can be extended to automatically discover implementations
  // For now, implementations need to be manually registered or use the decorator
  console.info(
    'Implementation discovery complete. Use ImplementationRegistry.getRegistrationSummary() to see registered implementations.'
  );
}
