/**
 * Base Interface Contract Test Framework
 *
 * Provides abstract test suite framework for testing interface compliance.
 * All contract tests extend this base class to ensure consistent testing patterns.
 */

import { describe, it, expect } from 'vitest';

/**
 * Contract test configuration for an interface method
 */
export interface MethodTestConfig {
  /** Method name to test */
  methodName: string;
  /** Parameters to pass to the method */
  parameters?: unknown[];
  /** Expected return type validation function */
  returnTypeValidator?: (result: unknown) => boolean;
  /** Whether the method should be async */
  isAsync?: boolean;
  /** Custom test description */
  description?: string;
}

/**
 * Configuration for testing interface error handling
 */
export interface ErrorTestConfig {
  /** Method name that should handle errors */
  methodName: string;
  /** Parameters that should cause an error */
  invalidParameters?: unknown[];
  /** Expected error type or message pattern */
  expectedError?: string | RegExp | (new (...args: unknown[]) => Error);
  /** Custom test description */
  description?: string;
}

/**
 * Implementation registration for contract testing
 */
export interface ImplementationRegistration<T> {
  /** Unique identifier for this implementation */
  name: string;
  /** Description of what this implementation does */
  description: string;
  /** Factory function to create a new instance for testing */
  createInstance: () => T | Promise<T>;
  /** Optional setup function called before each test */
  setup?: (instance: T) => Promise<void> | void;
  /** Optional cleanup function called after each test */
  cleanup?: (instance: T) => Promise<void> | void;
  /** Skip certain tests for this implementation */
  skipTests?: string[];
}

/**
 * Base contract test class that all interface contract tests should extend
 */
export abstract class BaseInterfaceContract<T> {
  protected implementations = new Map<string, ImplementationRegistration<T>>();
  protected abstract interfaceName: string;

  /**
   * Register an implementation for testing
   */
  registerImplementation(registration: ImplementationRegistration<T>): void {
    this.implementations.set(registration.name, registration);
  }

  /**
   * Get all registered implementations
   */
  getRegisteredImplementations(): ImplementationRegistration<T>[] {
    return Array.from(this.implementations.values());
  }

  /**
   * Create test suite for all registered implementations
   */
  createContractTests(): void {
    describe(`${this.interfaceName} Contract Tests`, () => {
      if (this.implementations.size === 0) {
        it('should have at least one implementation registered', () => {
          expect.fail(
            `No implementations registered for ${this.interfaceName}. Register implementations using registerImplementation()`
          );
        });
        return;
      }

      for (const [implName, registration] of this.implementations) {
        describe(`Implementation: ${implName}`, () => {
          it(`should have description: ${registration.description}`, () => {
            expect(registration.description).toBeTruthy();
            expect(typeof registration.description).toBe('string');
            expect(registration.description.length).toBeGreaterThan(10);
          });

          this.createImplementationTests(registration);
        });
      }
    });
  }

  /**
   * Create tests for a specific implementation
   */
  protected createImplementationTests(
    registration: ImplementationRegistration<T>
  ): void {
    describe('Interface Compliance', () => {
      this.testMethodExistence(registration);
      this.testMethodSignatures(registration);
      this.testReturnTypes(registration);
      this.testErrorHandling(registration);
    });

    describe('Implementation-Specific Behavior', () => {
      this.testImplementationBehavior(registration);
    });
  }

  /**
   * Test that all required methods exist on the implementation
   */
  protected testMethodExistence(
    registration: ImplementationRegistration<T>
  ): void {
    it('should implement all required interface methods', async () => {
      const instance = await registration.createInstance();

      if (registration.setup) {
        await registration.setup(instance);
      }

      try {
        const requiredMethods = this.getRequiredMethods();

        for (const methodName of requiredMethods) {
          expect(instance).toHaveProperty(methodName);
          expect(
            typeof (instance as unknown as Record<string, unknown>)[methodName]
          ).toBe('function');
        }
      } finally {
        if (registration.cleanup) {
          await registration.cleanup(instance);
        }
      }
    });
  }

  /**
   * Test method signatures match interface expectations
   */
  protected testMethodSignatures(
    registration: ImplementationRegistration<T>
  ): void {
    const methodTests = this.getMethodTests();

    for (const methodTest of methodTests) {
      if (registration.skipTests?.includes(methodTest.methodName)) {
        continue;
      }

      const testDescription =
        methodTest.description ||
        `should have correct signature for ${methodTest.methodName}`;

      it(testDescription, async () => {
        const instance = await registration.createInstance();

        if (registration.setup) {
          await registration.setup(instance);
        }

        try {
          const method = (instance as unknown as Record<string, unknown>)[
            methodTest.methodName
          ];
          expect(method).toBeDefined();
          expect(typeof method).toBe('function');

          // Test method can be called with expected parameters
          if (methodTest.parameters && typeof method === 'function') {
            const result = (method as (...args: unknown[]) => unknown).call(
              instance,
              ...methodTest.parameters
            );

            if (methodTest.isAsync) {
              expect(result).toBeInstanceOf(Promise);
              await result; // Ensure promise resolves
            }
          }
        } finally {
          if (registration.cleanup) {
            await registration.cleanup(instance);
          }
        }
      });
    }
  }

  /**
   * Test return types match interface expectations
   */
  protected testReturnTypes(registration: ImplementationRegistration<T>): void {
    const methodTests = this.getMethodTests().filter(
      test => test.returnTypeValidator
    );

    for (const methodTest of methodTests) {
      if (
        registration.skipTests?.includes(methodTest.methodName) ||
        !methodTest.returnTypeValidator
      ) {
        continue;
      }

      it(`should return correct type from ${methodTest.methodName}`, async () => {
        const instance = await registration.createInstance();

        if (registration.setup) {
          await registration.setup(instance);
        }

        try {
          const method = (instance as unknown as Record<string, unknown>)[
            methodTest.methodName
          ];
          if (typeof method === 'function') {
            const result = methodTest.isAsync
              ? await (method as (...args: unknown[]) => Promise<unknown>).call(
                  instance,
                  ...(methodTest.parameters || [])
                )
              : (method as (...args: unknown[]) => unknown).call(
                  instance,
                  ...(methodTest.parameters || [])
                );

            if (methodTest.returnTypeValidator) {
              expect(methodTest.returnTypeValidator(result)).toBe(true);
            }
          }
        } finally {
          if (registration.cleanup) {
            await registration.cleanup(instance);
          }
        }
      });
    }
  }

  /**
   * Test error handling behavior
   */
  protected testErrorHandling(
    registration: ImplementationRegistration<T>
  ): void {
    const errorTests = this.getErrorTests();

    for (const errorTest of errorTests) {
      if (registration.skipTests?.includes(errorTest.methodName)) {
        continue;
      }

      const testDescription =
        errorTest.description ||
        `should handle errors correctly in ${errorTest.methodName}`;

      it(testDescription, async () => {
        const instance = await registration.createInstance();

        if (registration.setup) {
          await registration.setup(instance);
        }

        try {
          const method = (instance as unknown as Record<string, unknown>)[
            errorTest.methodName
          ];

          if (errorTest.invalidParameters && typeof method === 'function') {
            await expect(async () => {
              const result = (method as (...args: unknown[]) => unknown).call(
                instance,
                ...(errorTest.invalidParameters || [])
              );
              if (result instanceof Promise) {
                await result;
              }
            }).rejects.toThrow(errorTest.expectedError);
          }
        } finally {
          if (registration.cleanup) {
            await registration.cleanup(instance);
          }
        }
      });
    }
  }

  /**
   * Abstract methods that concrete contract tests must implement
   */
  protected abstract getRequiredMethods(): string[];
  protected abstract getMethodTests(): MethodTestConfig[];
  protected abstract getErrorTests(): ErrorTestConfig[];
  protected abstract testImplementationBehavior(
    registration: ImplementationRegistration<T>
  ): void;
}

/**
 * Helper functions for common test validations
 */
export const ValidationHelpers = {
  /**
   * Validate that a value is a non-empty string
   */
  isNonEmptyString: (value: unknown): boolean => {
    return typeof value === 'string' && value.length > 0;
  },

  /**
   * Validate that a value is a boolean
   */
  isBoolean: (value: unknown): boolean => {
    return typeof value === 'boolean';
  },

  /**
   * Validate that a value is an object with specific properties
   */
  hasProperties:
    (requiredProps: string[]) =>
    (value: unknown): boolean => {
      if (typeof value !== 'object' || value === null) {
        return false;
      }

      return requiredProps.every(prop => prop in (value as object));
    },

  /**
   * Validate that a value is an array
   */
  isArray: (value: unknown): boolean => {
    return Array.isArray(value);
  },

  /**
   * Validate that a value is a Promise
   */
  isPromise: (value: unknown): boolean => {
    return value instanceof Promise;
  },

  /**
   * Validate that a value matches a specific structure
   */
  matchesStructure:
    <T>(validator: (value: unknown) => value is T) =>
    (value: unknown): boolean => {
      return validator(value);
    },
};
