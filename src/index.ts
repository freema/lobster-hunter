#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import { Scanner } from './scanner.js';
import { Reporter } from './reporter.js';
import { expandIPRange } from './ip-utils.js';
import type { ScanOptions } from './types.js';

interface CliOptions {
  port: string;
  timeout: string;
  concurrency: string;
  output?: string;
  file?: string;
  verbose: boolean;
  json: boolean;
}

const program = new Command();

program
  .name('lobster-hunter')
  .description('Network scanner for insecure ClawdBot installations')
  .version('1.0.0')
  .argument('[target]', 'IP address, CIDR range (10.0.0.0/24), or IP range (10.0.0.1-10.0.0.50)')
  .option('-p, --port <number>', 'Port to scan', '18789')
  .option('-t, --timeout <seconds>', 'Connection timeout in seconds', '3')
  .option('-c, --concurrency <num>', 'Max concurrent connections', '50')
  .option('-o, --output <file>', 'Output TXT file (auto-generated if not specified)')
  .option('-f, --file <file>', 'Read targets from file (one IP/range per line)')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--json', 'Also output JSON file', false)
  .action(async (target: string | undefined, options: CliOptions) => {
    try {
      await runScan(target, options);
    } catch (error) {
      console.error(
        '\n\x1b[31mError:\x1b[0m',
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

async function runScan(target: string | undefined, cliOptions: CliOptions): Promise<void> {
  let targets: string[] = [];

  if (cliOptions.file) {
    targets = await loadTargetsFromFile(cliOptions.file);
  } else if (target) {
    targets = expandIPRange(target);
  } else {
    console.error('Error: Must provide either a target or use -f/--file option');
    process.exit(1);
  }

  if (targets.length === 0) {
    console.error('Error: No valid targets found');
    process.exit(1);
  }

  checkPublicIPWarning(targets);

  const scanOptions: ScanOptions = {
    port: parseInt(cliOptions.port, 10),
    timeout: parseInt(cliOptions.timeout, 10),
    concurrency: parseInt(cliOptions.concurrency, 10),
    outputFile: cliOptions.output,
    verbose: cliOptions.verbose,
    jsonOutput: cliOptions.json,
  };

  const scanner = new Scanner(scanOptions);

  let savedResults = false;
  const outputFile = scanOptions.outputFile || Reporter.generateOutputFilename();

  const sigintHandler = async () => {
    console.log('\n\nScan interrupted. Saving results...');
    if (!savedResults) {
      const results = scanner.getResults();
      if (results.length > 0) {
        const { createSummary } = await import('./types.js');
        const summary = createSummary(
          results,
          results[0]?.timestamp || new Date(),
          new Date(),
          target || cliOptions.file || 'unknown'
        );
        await Reporter.saveTxtReport(results, summary, outputFile);
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void sigintHandler();
  });

  const { results, summary } = await scanner.scanTargets(targets);

  Reporter.printSummary(summary);

  await Reporter.saveTxtReport(results, summary, outputFile);
  savedResults = true;

  if (scanOptions.jsonOutput) {
    const jsonFile = outputFile.replace(/\.txt$/, '.json');
    await Reporter.saveJsonReport(results, summary, jsonFile);
  }
}

async function loadTargetsFromFile(filename: string): Promise<string[]> {
  const content = await fs.readFile(filename, 'utf-8');
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  const targets: string[] = [];
  for (const line of lines) {
    try {
      const expanded = expandIPRange(line);
      targets.push(...expanded);
    } catch (error) {
      console.warn(
        `Warning: Skipping invalid target "${line}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return targets;
}

function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(n => parseInt(n, 10));
  if (parts.length !== 4) return false;

  // 127.0.0.0/8 - Loopback
  if (parts[0] === 127) return true;

  // 10.0.0.0/8 - Private
  if (parts[0] === 10) return true;

  // 172.16.0.0/12 - Private
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16 - Private
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 169.254.0.0/16 - Link-local
  if (parts[0] === 169 && parts[1] === 254) return true;

  return false;
}

function checkPublicIPWarning(targets: string[]): void {
  const publicIPs = targets.filter(ip => !isPrivateIP(ip));

  if (publicIPs.length > 0) {
    console.log('\n\x1b[33m⚠️  WARNING: PUBLIC IP ADDRESSES DETECTED!\x1b[0m');
    console.log('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log('You are about to scan PUBLIC internet addresses.');
    console.log('This will send REAL network requests to external systems.');
    console.log('');
    console.log('\x1b[31mUnauthorized scanning may be ILLEGAL!\x1b[0m');
    console.log('');
    console.log(`Public IPs in scan: ${publicIPs.length} out of ${targets.length} total`);
    console.log('Sample:', publicIPs.slice(0, 5).join(', '));
    console.log('');
    console.log('Only proceed if you have:');
    console.log('  ✓ Written authorization to scan these systems');
    console.log('  ✓ Ownership of these IP addresses');
    console.log('  ✓ Bug bounty permission for these ranges');
    console.log('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
  }
}

program.parse();
