#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Read package.json to get version
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf8')
);
const version = packageJson.version;

// Read skill template
const skillTemplate = readFileSync(
  join(projectRoot, 'resources/templates/skills/SKILL.md'),
  'utf8'
);

// Replace version placeholder
const skillContent = skillTemplate.replace('${VERSION}', version);

// Create skill directory and write file
const skillDir = join(projectRoot, 'packages/mcp-server/skill');
mkdirSync(skillDir, { recursive: true });
writeFileSync(join(skillDir, 'SKILL.md'), skillContent);

console.log(
  `Generated packages/mcp-server/skill/SKILL.md with version ${version}`
);
