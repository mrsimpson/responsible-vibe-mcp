# Plugin Architecture Design

## Core Principle: Zero Plugin Knowledge in Core Application

**CRITICAL DESIGN DECISION**: The core application must have **ZERO knowledge** of any specific plugins (beads, serena, etc.). This document captures the architecture decisions to prevent regression to if-statement-based code.

## Architecture Overview

### Core Application Responsibilities
- Provide default implementations for all components
- Execute semantic lifecycle hooks at appropriate times
- Remain completely plugin-agnostic

### Plugin Responsibilities  
- Manage their own internal components
- Register for lifecycle hooks based on environment variables
- Encapsulate ALL plugin-specific logic internally

## Plugin Interface (Final Design)

```typescript
interface IPlugin {
  getName(): string;
  getSequence(): number;
  isEnabled(): boolean;
  getHooks(): PluginHooks;
}

interface PluginHooks {
  // Pure semantic lifecycle events - standardized context pattern
  beforeStartDevelopment?: (context: PluginHookContext, args: StartDevelopmentArgs) => Promise<void>;
  afterStartDevelopment?: (context: PluginHookContext, args: StartDevelopmentArgs, result: StartDevelopmentResult) => Promise<void>;
  
  afterPlanFileCreated?: (context: PluginHookContext, planFilePath: string, content: string) => Promise<string>;
  
  beforePhaseTransition?: (context: PluginHookContext, currentPhase: string, targetPhase: string) => Promise<void>;
  
  afterInstructionsGenerated?: (context: PluginHookContext, instructions: GeneratedInstructions) => Promise<GeneratedInstructions>;
}

// Standardized context for all plugin hooks
interface PluginHookContext {
  // Common context information needed across hooks (READ-ONLY data only)
  conversationId: string;
  planFilePath: string;
  currentPhase: string;
  workflow: string;
  projectPath: string;
  gitBranch: string;
  
  // Optional context that may not be available in all hooks
  targetPhase?: string; // Only available in phase transitions
  
  // NO SERVER COMPONENTS - plugins should not have direct access to:
  // - conversationManager (could manipulate conversations)
  // - transitionEngine (could force transitions)  
  // - planManager (could bypass hook system)
  // - instructionGenerator (could generate instructions outside flow)
}

interface IPluginRegistry {
  registerPlugin(plugin: IPlugin): void;
  getEnabledPlugins(): IPlugin[];
  executeHook<T extends keyof PluginHooks>(hookName: T, ...args: Parameters<NonNullable<PluginHooks[T]>>): Promise<any>;
  hasHook(hookName: keyof PluginHooks): boolean;
  getPluginNames(): string[];
  clear(): void;
}

// Supporting interfaces for hook parameters
interface StartDevelopmentArgs {
  workflow: string;
  commit_behaviour: string;
  require_reviews?: boolean;
  project_path?: string;
}

interface StartDevelopmentResult {
  conversationId: string;
  planFilePath: string;
  phase: string;
  workflow: string;
}

interface GeneratedInstructions {
  instructions: string;
  planFilePath: string;
  phase: string;
}

// REMOVED: PlanCreationContext, InstructionContext - replaced by standardized PluginHookContext
```

## Key Anti-Patterns to Avoid

### ❌ DO NOT: Component Providers in Plugin Interface
```typescript
// WRONG - This makes core app aware of plugin components
interface IPlugin {
  providePlanManager?(): IPlanManager;
  provideInstructionGenerator?(): IInstructionGenerator;
}
```

### ❌ DO NOT: Strategy Pattern in Core App
```typescript
// WRONG - This creates if-statements in core app
class ServerComponentsFactory {
  createPlanManager(): IPlanManager {
    if (this.taskBackend.backend === 'beads') {
      return new BeadsPlanManager();
    }
    return new PlanManager();
  }
}
```

### ❌ DO NOT: Plugin-Specific Imports in Core
```typescript
// WRONG - Core app should never import plugin classes
import { BeadsIntegration } from './beads-integration.js';
```

## Correct Implementation Pattern

### ✅ Core Application (Plugin-Agnostic)
```typescript
// Always uses defaults, executes hooks
export class PlanManager implements IPlanManager {
  async ensurePlanFile(planFilePath: string, projectPath: string, gitBranch: string) {
    let content = await this.generateInitialPlanContent(/*...*/);
    
    // Create limited plugin context with only necessary read-only data
    const pluginContext: PluginHookContext = {
      conversationId: this.conversationId, // Assume available
      planFilePath,
      currentPhase: this.currentPhase, // Assume available
      workflow: this.workflow, // Assume available
      projectPath,
      gitBranch
      // NO server components - plugins get only data they need
    };
    
    // Let plugins enhance content - plugins cannot manipulate core components
    content = await pluginRegistry.executeHook('afterPlanFileCreated', pluginContext, planFilePath, content);
    
    await writeFile(planFilePath, content);
  }
}
```

### ✅ Plugin Implementation (Self-Contained)
```typescript
// Plugin manages its own components internally
class BeadsPlugin implements IPlugin {
  private beadsPlanManager = new BeadsPlanManager();
  private beadsInstructionGenerator = new BeadsInstructionGenerator();
  
  isEnabled(): boolean {
    return process.env.TASK_BACKEND === 'beads';
  }

  getHooks(): PluginHooks {
    return {
      afterPlanFileCreated: async (context: PluginHookContext, planFilePath: string, content: string) => {
        // Plugin has access to necessary context but cannot manipulate core components
        return await this.beadsPlanManager.enhancePlanContent(content, {
          projectPath: context.projectPath,
          conversationId: context.conversationId,
          workflow: context.workflow,
          gitBranch: context.gitBranch
        });
      },
      
      beforePhaseTransition: async (context: PluginHookContext, currentPhase: string, targetPhase: string) => {
        // Plugin manages its own task backend client - no access to core components
        await this.validateBeadsTaskCompletion(
          context.conversationId,
          currentPhase,
          targetPhase,
          context.projectPath
        );
      }
    };
  }
}
```

## Benefits of This Architecture

1. **Zero Coupling**: Core app has no knowledge of plugins
2. **No If-Statements**: Eliminates all plugin-specific conditionals  
3. **Clean Extension**: New plugins (serena, etc.) follow same pattern
4. **Testability**: Core app and plugins can be tested independently
5. **Maintainability**: Plugin changes don't affect core app

## Migration Strategy

Since we're keeping the same `TASK_BACKEND` environment variable:
- ✅ **No user migration needed** - same configuration
- ✅ **BeadsPlugin registers based on `TASK_BACKEND=beads`**
- ✅ **Direct refactoring** - replace if-statements with hooks
- ✅ **Zero behavior change** for end users

## Future Extensions (Serena, etc.)

New plugins follow identical pattern:
```typescript
class SerenaPlugin implements IPlugin {
  isEnabled(): boolean {
    return process.env.TASK_BACKEND === 'serena';
  }
  // ... same hook pattern
}
```

**Remember**: The core application should never know SerenaPlugin exists!

## Implementation Details

### ServerContext Extension
The `ServerContext` interface must be extended to include `pluginRegistry`:
```typescript
export interface ServerContext {
  // ... existing properties
  pluginRegistry: IPluginRegistry;
}
```

### Plugin Registration in server-config.ts
```typescript
// In initializeServerComponents()
const pluginRegistry = new PluginRegistry();

// Register BeadsPlugin if environment indicates beads backend
if (process.env.TASK_BACKEND === 'beads') {
  const { BeadsPlugin } = await import('./plugin-system/beads-plugin.js');
  const beadsPlugin = new BeadsPlugin({ projectPath });
  if (beadsPlugin.isEnabled()) {
    pluginRegistry.registerPlugin(beadsPlugin);
  }
}

// Add to ServerContext
const context: ServerContext = {
  // ... existing properties
  pluginRegistry,
};
```

### ServerComponentsFactory Elimination
**CRITICAL**: Eliminate ServerComponentsFactory entirely. Core app uses defaults:
```typescript
// REMOVE ServerComponentsFactory usage
// const componentsFactory = new ServerComponentsFactory({...});
// const planManager = componentsFactory.createPlanManager();

// REPLACE with direct default instantiation
const planManager = new PlanManager();
const instructionGenerator = new InstructionGenerator(planManager);
```

### Tool Handler Integration

#### start-development.ts
Replace beads if-statement (line 217):
```typescript
// REMOVE:
// if (taskBackendConfig.backend === 'beads') {
//   await this.setupBeadsIntegration(...);
// }

// REPLACE with:
const pluginContext: PluginHookContext = {
  conversationId: conversationContext.conversationId,
  planFilePath: conversationContext.planFilePath,
  currentPhase: conversationContext.currentPhase,
  workflow: selectedWorkflow,
  projectPath,
  gitBranch: conversationContext.gitBranch
  // NO serverContext - plugins don't need access to core components
};

await context.pluginRegistry.executeHook(
  'afterStartDevelopment',
  pluginContext,
  {
    workflow: selectedWorkflow,
    commit_behaviour: args.commit_behaviour,
    require_reviews: args.require_reviews,
    project_path: projectPath
  },
  {
    conversationId: conversationContext.conversationId,
    planFilePath: conversationContext.planFilePath,
    phase: conversationContext.currentPhase,
    workflow: selectedWorkflow
  }
);
```

#### proceed-to-phase.ts
Replace beads validation call (line 84):
```typescript
// REMOVE:
// await this.validateBeadsTaskCompletion(conversationId, currentPhase, target_phase, conversationContext.projectPath);

// REPLACE with:
const pluginContext: PluginHookContext = {
  conversationId,
  planFilePath: conversationContext.planFilePath,
  currentPhase,
  workflow: conversationContext.workflowName,
  projectPath: conversationContext.projectPath,
  gitBranch: conversationContext.gitBranch,
  targetPhase: target_phase
  // NO serverContext - plugins should not manipulate core components
};

await context.pluginRegistry.executeHook(
  'beforePhaseTransition',
  pluginContext,
  currentPhase,
  target_phase
);
```

### BeadsPlugin Implementation Requirements

The BeadsPlugin must encapsulate ALL current beads functionality:

#### Internal Components
```typescript
class BeadsPlugin implements IPlugin {
  private beadsIntegration: BeadsIntegration;
  private beadsStateManager: BeadsStateManager;
  private beadsPlanManager: BeadsPlanManager;
  private beadsInstructionGenerator: BeadsInstructionGenerator;
  private beadsTaskBackendClient: BeadsTaskBackendClient;
  
  // ... implementation
}
```

#### Hook Mappings
- `afterStartDevelopment` → Replaces `setupBeadsIntegration()` method from start-development.ts
- `beforePhaseTransition` → Replaces `validateBeadsTaskCompletion()` method from proceed-to-phase.ts  
- `afterPlanFileCreated` → Enhances plan content with beads task IDs

#### Methods to Move from Core to Plugin
1. **setupBeadsIntegration()** (start-development.ts:652-720)
2. **validateBeadsTaskCompletion()** (proceed-to-phase.ts:303-420)
3. **extractGoalFromPlan()** helper method
4. **updatePlanFileWithPhaseTaskIds()** helper method

### Error Handling Requirements
- Plugin validation errors (incomplete tasks) MUST bubble up to block transitions
- System errors (beads CLI unavailable) should gracefully degrade
- Error messages must remain identical to current implementation
- Same bd CLI command suggestions in error messages

### Testing Migration
1. **Move beads-specific tests** to BeadsPlugin test suite
2. **Update core tests** to mock `pluginRegistry.executeHook()` calls
3. **Add hook integration tests** for proper parameter passing
4. **Regression tests** to ensure identical behavior with/without beads

---

*This document serves as the authoritative design reference to prevent regression to if-statement-based plugin integration.*