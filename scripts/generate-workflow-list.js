#!/usr/bin/env node

import { writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workflowsDir = resolve(__dirname, '../resources/workflows');
const files = readdirSync(workflowsDir);

const workflows = files
  .filter(file => file.endsWith('.yaml'))
  .map(file => file.replace('.yaml', ''))
  .sort();

const content = `// Auto-generated workflow list
export const workflowList = [
${workflows.map(name => `  '${name}',`).join('\n')}
];
`;

const outputPath = resolve(
  __dirname,
  '../packages/visualizer/src/services/workflow-list.ts'
);
writeFileSync(outputPath, content);

console.log(`Generated workflow-list.ts with ${workflows.length} workflows`);
