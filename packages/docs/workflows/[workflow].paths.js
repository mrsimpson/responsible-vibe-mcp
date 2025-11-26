import { readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getAvailableWorkflows() {
  try {
    const workflowsDir = resolve(__dirname, '../../../resources/workflows');
    const files = readdirSync(workflowsDir);

    return files
      .filter(file => file.endsWith('.yaml'))
      .map(file => file.replace('.yaml', ''))
      .sort();
  } catch (error) {
    console.error('Failed to discover workflows:', error);
    return [];
  }
}

export default {
  paths() {
    const workflows = getAvailableWorkflows();
    return workflows.map(workflow => ({
      params: { workflow },
    }));
  },
};
