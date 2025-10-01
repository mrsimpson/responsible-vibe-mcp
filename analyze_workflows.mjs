import { WorkflowManager } from './dist/workflow-manager.js';
import { generateWorkflowDescription } from './dist/server/server-helpers.js';

const wm = new WorkflowManager();
const workflows = wm.getAvailableWorkflows();
const description = generateWorkflowDescription(workflows);

console.log('Total workflows:', workflows.length);
console.log('Description length:', description.length, 'characters');
console.log('Average per workflow:', Math.round(description.length / workflows.length), 'characters');
console.log('\nWorkflow names:');
workflows.forEach(w => console.log(`- ${w.name}: ${w.description.length} chars`));
console.log('\nFirst 500 characters of full description:');
console.log(description.substring(0, 500) + '...');
