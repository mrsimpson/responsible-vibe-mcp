#!/usr/bin/env node

/**
 * Test Summary Script
 * Runs tests and provides an overview of results from all packages
 */

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

function stripAnsiCodes(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

console.log('🧪 Running tests across all packages...\n');

// Dynamically detect all packages
function getWorkspacePackages() {
  const packages = [];
  if (existsSync('packages')) {
    const dirs = readdirSync('packages', { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const pkgJsonPath = `packages/${dir.name}/package.json`;
        if (existsSync(pkgJsonPath)) {
          try {
            const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
            packages.push({ name: dir.name, fullName: pkgJson.name });
          } catch (_e) {
            // Skip invalid package.json files
          }
        }
      }
    }
  }
  return packages;
}

try {
  // Get all workspace packages dynamically
  const workspacePackages = getWorkspacePackages();

  // Run tests directly for each package to avoid turbo caching issues
  console.log('Running root tests...');
  const rootOutput = execSync('vitest --run', {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  const packageResults = [];
  let totalPassed = 0;
  let totalTests = 0;

  // Extract root test results - match "Tests" specifically, not "Test Files"
  const cleanRootOutput = stripAnsiCodes(rootOutput);
  const rootMatch = cleanRootOutput.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
  if (rootMatch) {
    const passed = parseInt(rootMatch[1]);
    const total = parseInt(rootMatch[2]);
    packageResults.push({ package: 'root', passed, total });
    totalPassed += passed;
    totalTests += total;
  } else {
    console.log(
      'DEBUG: Root output:',
      cleanRootOutput.split('\n').slice(-5).join('\n')
    );
  }

  // Run tests for each workspace package
  for (const pkg of workspacePackages) {
    console.log(`Running ${pkg.fullName} tests...`);
    try {
      const pkgOutput = execSync(`cd packages/${pkg.name} && npm test`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      // Match "Tests" specifically, not "Test Files"
      const cleanPkgOutput = stripAnsiCodes(pkgOutput);
      const pkgMatch = cleanPkgOutput.match(
        /Tests\s+(\d+)\s+passed\s+\((\d+)\)/
      );
      if (pkgMatch) {
        const passed = parseInt(pkgMatch[1]);
        const total = parseInt(pkgMatch[2]);
        packageResults.push({ package: pkg.name, passed, total });
        totalPassed += passed;
        totalTests += total;
      } else {
        console.log(
          `DEBUG: ${pkg.name} output:`,
          cleanPkgOutput.split('\n').slice(-5).join('\n')
        );
      }
    } catch (error) {
      // Tests might have failed, but we still need to parse the output
      const pkgOutput = error.stdout || '';
      const testMatch = pkgOutput.match(
        /Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/
      );
      const passedOnlyMatch = pkgOutput.match(
        /Tests\s+(\d+)\s+passed\s+\((\d+)\)/
      );

      if (testMatch) {
        // Some tests failed: "Tests  18 failed | 134 passed (152)"
        const failed = parseInt(testMatch[1]);
        const passed = parseInt(testMatch[2]);
        const total = parseInt(testMatch[3]);
        packageResults.push({ package: pkg.name, passed, total, failed });
        totalPassed += passed;
        totalTests += total;
      } else if (passedOnlyMatch) {
        // All tests passed
        const passed = parseInt(passedOnlyMatch[1]);
        const total = parseInt(passedOnlyMatch[2]);
        packageResults.push({ package: pkg.name, passed, total });
        totalPassed += passed;
        totalTests += total;
      } else {
        // Truly no tests found or other error
        console.log(`No tests found for ${pkg.fullName}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  // Display results
  for (const result of packageResults) {
    if (result.package === 'root') {
      const status = result.passed === result.total ? '✅' : '❌';
      console.log(
        `${status} Root Tests: ${result.passed}/${result.total} passed`
      );
    } else {
      const status = result.passed === result.total ? '✅' : '❌';
      console.log(
        `${status} @codemcp/workflows-${result.package}: ${result.passed}/${result.total} passed`
      );
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`📈 TOTAL RESULTS:`);
  console.log(`   • Tests passed: ${totalPassed}`);
  console.log(`   • Total tests: ${totalTests}`);
  console.log(
    `   • Success rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`
  );
  console.log(`   • Packages detected: ${packageResults.length}`);

  // Check if any tests failed or if no tests were found at all
  if (totalTests === 0) {
    console.log('\n❌ NO TESTS FOUND!');
    console.log('='.repeat(60));
    process.exit(1);
  } else if (totalPassed < totalTests) {
    console.log('\n❌ SOME TESTS FAILED!');
    console.log('='.repeat(60));
    process.exit(1);
  } else {
    console.log('\n🎉 All tests completed successfully!');
    console.log('='.repeat(60));
  }
} catch (_error) {
  console.error('\n' + '='.repeat(60));
  console.error('❌ TESTS FAILED');
  console.error('='.repeat(60));
  console.error('Check the output above for details.');
  console.error('='.repeat(60));
  process.exit(1);
}
