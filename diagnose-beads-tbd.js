#!/usr/bin/env node

/**
 * Beads TBD Replacement Diagnostic Tool
 *
 * Use this tool to diagnose TBD replacement issues in existing plan files.
 *
 * Usage:
 *   node diagnose-beads-tbd.js /path/to/.vibe/plan.md
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const [, , planFilePath] = process.argv;

if (!planFilePath) {
  console.error('Usage: node diagnose-beads-tbd.js <plan-file-path>');
  process.exit(1);
}

if (!existsSync(planFilePath)) {
  console.error(`Plan file not found: ${planFilePath}`);
  process.exit(1);
}

async function diagnoseTBDIssues() {
  try {
    const content = await readFile(planFilePath, 'utf-8');

    console.log('🔍 BEADS TBD REPLACEMENT DIAGNOSTICS\n');
    console.log(`📄 Plan File: ${planFilePath}\n`);

    // Check for TBD placeholders
    const tbdMatches = content.match(/<!-- beads-phase-id: TBD -->/g) || [];
    console.log(`❓ TBD Placeholders Found: ${tbdMatches.length}`);

    if (tbdMatches.length === 0) {
      console.log(
        '✅ SUCCESS: No TBD placeholders found - replacement worked correctly!\n'
      );
    } else {
      console.log('❌ ISSUE: TBD placeholders remain - replacement failed\n');
    }

    // Check for actual beads task IDs
    const taskIdMatches =
      content.match(/<!-- beads-phase-id: (?!TBD)[\w\d-]+ -->/g) || [];
    console.log(`🎯 Actual Task IDs Found: ${taskIdMatches.length}`);

    if (taskIdMatches.length > 0) {
      console.log('Task IDs found:');
      for (const match of taskIdMatches) {
        const taskId = match.match(/beads-phase-id: ([\w\d-]+)/)?.[1];
        console.log(`  - ${taskId}`);
      }
      console.log();
    }

    // Analyze phase structure
    const phaseHeaders = content.match(/^## \w+/gm) || [];
    console.log(`📋 Phase Headers Found: ${phaseHeaders.length}`);
    for (const header of phaseHeaders) {
      console.log(`  - ${header}`);
    }
    console.log();

    // Check for beads mode indicators
    const beadsModeIndicators = [
      '**🔧 TASK MANAGEMENT VIA CLI TOOL bd**',
      '*Task Management: Beads Issue Tracker*',
    ];

    const isBeadsMode = beadsModeIndicators.some(indicator =>
      content.includes(indicator)
    );
    console.log(`🔧 Beads Mode Detected: ${isBeadsMode ? '✅ YES' : '❌ NO'}`);

    if (!isBeadsMode) {
      console.log('⚠️  WARNING: Plan file does not appear to be in beads mode');
      console.log(
        '   This could indicate the file was created without TASK_BACKEND=beads'
      );
    }

    console.log();

    // Detailed analysis of each phase
    console.log('📊 PHASE-BY-PHASE ANALYSIS:');

    for (const header of phaseHeaders) {
      const phaseName = header.replace('## ', '');
      console.log(`\n  Phase: ${phaseName}`);

      // Find content between this phase and the next
      const phaseIndex = content.indexOf(header);
      const nextPhaseIndex = content.indexOf('##', phaseIndex + 1);
      const phaseContent =
        nextPhaseIndex === -1
          ? content.substring(phaseIndex)
          : content.substring(phaseIndex, nextPhaseIndex);

      // Check for beads-phase-id comment
      const hasBeadsComment = phaseContent.includes('<!-- beads-phase-id:');
      const hasTBD = phaseContent.includes('<!-- beads-phase-id: TBD -->');
      const taskIdMatch = phaseContent.match(
        /<!-- beads-phase-id: ((?!TBD)[\w\d-]+) -->/
      );

      console.log(`    Has beads comment: ${hasBeadsComment ? '✅' : '❌'}`);
      if (hasTBD) {
        console.log(`    Status: ❌ TBD placeholder (not replaced)`);
      } else if (taskIdMatch) {
        console.log(`    Status: ✅ Task ID: ${taskIdMatch[1]}`);
      } else if (!hasBeadsComment) {
        console.log(`    Status: ⚠️  No beads comment (unexpected)`);
      }
    }

    console.log('\n🔍 RECOMMENDATIONS:');

    if (tbdMatches.length > 0) {
      console.log('1. Check if beads CLI is working: `bd --version`');
      console.log('2. Verify TASK_BACKEND=beads environment variable is set');
      console.log('3. Check beads CLI permissions and network connectivity');
      console.log('4. Review server logs for beads integration errors');
      console.log(
        '5. Try running start_development again with verbose logging'
      );
    } else {
      console.log('✅ Plan file appears to be correctly configured for beads');
    }
  } catch (error) {
    console.error('❌ Error reading plan file:', error);
    process.exit(1);
  }
}

diagnoseTBDIssues();
