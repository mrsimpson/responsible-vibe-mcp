#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load migration inventory to get accurate file mappings
function loadMigrationInventory() {
  try {
    const inventoryPath = join(
      projectRoot,
      '.vibe',
      'migration-inventory.json'
    );
    const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));

    // Build mapping from original file names to target packages
    const fileToPackageMap = {};

    for (const [_packageKey, packageInfo] of Object.entries(
      inventory.packages
    )) {
      for (const fileMove of packageInfo.files_moved) {
        // Extract filename without extension from the original path
        const originalFile = fileMove.from
          .replace('src/', '')
          .replace('.ts', '');
        fileToPackageMap[originalFile] = {
          targetPackage: fileMove.target_package,
          exportName: fileMove.export_name,
        };
      }
    }

    return fileToPackageMap;
  } catch (error) {
    console.error('⚠️  Could not load migration inventory:', error.message);
    console.log('📝 Falling back to hardcoded core files list');
    return null;
  }
}

// Fallback list if inventory is not available
const fallbackCoreFiles = [
  'state-machine',
  'state-machine-loader',
  'state-machine-types',
  'workflow-manager',
  'database',
  'conversation-manager',
  'plan-manager',
  'template-manager',
  'project-docs-manager',
  'file-detection-manager',
  'config-manager',
  'git-manager',
  'logger',
  'interaction-logger',
  'instruction-generator',
  'system-prompt-generator',
  'transition-engine',
  'path-validation-utils',
  'types',
];

// Track changes for inventory
const changes = [];

function getAllFiles(dir, extensions = ['.ts', '.js']) {
  const files = [];

  function traverse(currentDir) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and dist directories
        if (!['node_modules', 'dist', '.git'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function fixImportsInFile(filePath, fileToPackageMap) {
  const content = readFileSync(filePath, 'utf8');
  let newContent = content;
  const fileChanges = [];

  // Skip files in packages/core/src (they use relative imports)
  if (filePath.includes('packages/core/src')) {
    return { changed: false, changes: [] };
  }

  // Pattern to match import statements
  const importRegex =
    /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Check if this import should be updated using inventory
    if (fileToPackageMap) {
      for (const [fileName, packageInfo] of Object.entries(fileToPackageMap)) {
        const patterns = [
          new RegExp(`\\.\\.?/.*src/${fileName}(\\.js)?$`),
          new RegExp(`\\.\\.?/${fileName}(\\.js)?$`),
          new RegExp(`^${fileName}(\\.js)?$`),
        ];

        if (patterns.some(pattern => pattern.test(importPath))) {
          const newImportPath = packageInfo.targetPackage;
          const oldImport = match[0];
          const newImport = oldImport.replace(importPath, newImportPath);

          newContent = newContent.replace(oldImport, newImport);
          fileChanges.push({
            old: importPath,
            new: newImportPath,
            fullOld: oldImport,
            fullNew: newImport,
            targetPackage: packageInfo.targetPackage,
          });
          break;
        }
      }
    } else {
      // Fallback to hardcoded list
      for (const coreFile of fallbackCoreFiles) {
        const patterns = [
          new RegExp(`\\.\\.?/.*src/${coreFile}(\\.js)?$`),
          new RegExp(`\\.\\.?/${coreFile}(\\.js)?$`),
          new RegExp(`^${coreFile}(\\.js)?$`),
        ];

        if (patterns.some(pattern => pattern.test(importPath))) {
          const newImportPath = `@responsible-vibe/core`;
          const oldImport = match[0];
          const newImport = oldImport.replace(importPath, newImportPath);

          newContent = newContent.replace(oldImport, newImport);
          fileChanges.push({
            old: importPath,
            new: newImportPath,
            fullOld: oldImport,
            fullNew: newImport,
            targetPackage: '@responsible-vibe/core',
          });
          break;
        }
      }
    }
  }

  return {
    changed: newContent !== content,
    newContent,
    changes: fileChanges,
  };
}

function main() {
  console.log('🔧 Fixing import paths for monorepo migration...\n');

  // Load migration inventory
  const fileToPackageMap = loadMigrationInventory();
  if (fileToPackageMap) {
    console.log(
      '✅ Loaded migration inventory with',
      Object.keys(fileToPackageMap).length,
      'file mappings'
    );
  }

  // Get all TypeScript and JavaScript files
  const allFiles = getAllFiles(projectRoot, ['.ts', '.js']);

  // Filter out files we don't want to modify
  const filesToProcess = allFiles.filter(file => {
    const relativePath = relative(projectRoot, file);
    return (
      !relativePath.includes('node_modules') &&
      !relativePath.includes('dist') &&
      !relativePath.includes('.git') &&
      !relativePath.endsWith('fix-imports.js')
    );
  });

  console.log(`📁 Processing ${filesToProcess.length} files...\n`);

  let totalChanges = 0;
  let filesChanged = 0;

  for (const filePath of filesToProcess) {
    const result = fixImportsInFile(filePath, fileToPackageMap);

    if (result.changed) {
      writeFileSync(filePath, result.newContent, 'utf8');
      filesChanged++;
      totalChanges += result.changes.length;

      const relativePath = relative(projectRoot, filePath);
      console.log(`✅ ${relativePath}`);

      for (const change of result.changes) {
        console.log(`   ${change.old} → ${change.new}`);
        changes.push({
          file: relativePath,
          old_import: change.old,
          new_import: change.new,
          target_package: change.targetPackage,
          timestamp: new Date().toISOString(),
        });
      }
      console.log();
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${filesToProcess.length}`);
  console.log(`   Files changed: ${filesChanged}`);
  console.log(`   Total import changes: ${totalChanges}`);

  // Save changes to inventory file
  if (changes.length > 0) {
    const inventoryPath = join(projectRoot, '.vibe', 'import-fixes.json');
    const inventory = {
      timestamp: new Date().toISOString(),
      summary: {
        files_processed: filesToProcess.length,
        files_changed: filesChanged,
        total_changes: totalChanges,
      },
      changes,
    };

    writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
    console.log(`\n💾 Changes logged to: .vibe/import-fixes.json`);
  }

  console.log('\n🎉 Import fixing complete!');
  console.log('\n🧪 Next steps:');
  console.log('   1. Run: npm run build');
  console.log('   2. Run: npm test');
  console.log('   3. Verify all tests pass');
}

main();
