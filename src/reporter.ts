import fs from 'fs/promises';
import type { ScanResult, ScanSummary } from './types.js';

export class Reporter {
  static async saveTxtReport(
    results: ScanResult[],
    summary: ScanSummary,
    outputFile: string
  ): Promise<void> {
    const lines: string[] = [];

    lines.push('# ClawdBot Scan Results');
    lines.push(`# Date: ${summary.startTime.toLocaleString()}`);
    lines.push(`# Target: ${summary.targets}`);
    lines.push(`# Port: ${results[0]?.port || 'N/A'}`);
    lines.push('');

    const sortedResults = results.slice().sort((a, b) => {
      const statusOrder = { VULNERABLE: 0, SECURED: 1, OPEN: 2, ERROR: 3, CLOSED: 4 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    for (const result of sortedResults) {
      const status = `[${result.status}]`.padEnd(13);
      const target = `${result.ip}:${result.port}`.padEnd(22);
      lines.push(`${status} ${target} - ${result.details}`);
    }

    lines.push('');
    lines.push('---');
    lines.push('Summary:');
    lines.push(`Total scanned: ${summary.total}`);
    lines.push(`Vulnerable: ${summary.vulnerable}`);
    lines.push(`Secured: ${summary.secured}`);
    lines.push(`Open: ${summary.open}`);
    if (summary.errors > 0) {
      lines.push(`Errors: ${summary.errors}`);
    }
    lines.push(`Closed: ${summary.closed}`);
    lines.push('');

    const duration = (summary.endTime.getTime() - summary.startTime.getTime()) / 1000;
    lines.push(`Scan duration: ${duration.toFixed(2)}s`);

    await fs.writeFile(outputFile, lines.join('\n'), 'utf-8');
    console.log(`\nResults saved to: ${outputFile}`);
  }

  static async saveJsonReport(
    results: ScanResult[],
    summary: ScanSummary,
    outputFile: string
  ): Promise<void> {
    const jsonOutput = {
      summary: {
        ...summary,
        duration: (summary.endTime.getTime() - summary.startTime.getTime()) / 1000,
      },
      results: results.map(r => ({
        ...r,
        timestamp: r.timestamp.toISOString(),
      })),
    };

    await fs.writeFile(outputFile, JSON.stringify(jsonOutput, null, 2), 'utf-8');
    console.log(`JSON results saved to: ${outputFile}`);
  }

  static printSummary(summary: ScanSummary): void {
    console.log('\n' + '='.repeat(50));
    console.log('SCAN SUMMARY');
    console.log('='.repeat(50));

    const duration = (summary.endTime.getTime() - summary.startTime.getTime()) / 1000;

    console.log(`Total scanned:  ${summary.total}`);
    console.log(`\x1b[31mVulnerable:     ${summary.vulnerable}\x1b[0m`);
    console.log(`\x1b[32mSecured:        ${summary.secured}\x1b[0m`);
    console.log(`\x1b[33mOpen:           ${summary.open}\x1b[0m`);
    if (summary.errors > 0) {
      console.log(`\x1b[31mErrors:         ${summary.errors}\x1b[0m`);
    }
    console.log(`\x1b[90mClosed:         ${summary.closed}\x1b[0m`);
    console.log(`Duration:       ${duration.toFixed(2)}s`);
    console.log('='.repeat(50) + '\n');

    if (summary.vulnerable > 0) {
      console.log('\x1b[41m\x1b[97m                                                    \x1b[0m');
      console.log(
        `\x1b[41m\x1b[97m ⚠️  CRITICAL: ${summary.vulnerable} VULNERABLE INSTANCE(S) FOUND!      \x1b[0m`
      );
      console.log('\x1b[41m\x1b[97m                                                    \x1b[0m');
      console.log('');
      console.log('\x1b[31mImmediate action required:\x1b[0m');
      console.log('  1. Review vulnerable instances in the report');
      console.log('  2. Enable authentication on ClawdBot Gateway');
      console.log('  3. Restrict network access if possible');
      console.log('  4. Check for unauthorized access in logs');
      console.log('');
      console.log('\x1b[33mSee: https://clawd.bot for security configuration\x1b[0m\n');
    }
  }

  static printVulnerableList(results: ScanResult[]): void {
    const vulnerable = results.filter(r => r.status === 'VULNERABLE');

    if (vulnerable.length > 0) {
      console.log('\n\x1b[31m' + '='.repeat(50));
      console.log(`VULNERABLE INSTANCES (${vulnerable.length})`);
      console.log('='.repeat(50) + '\x1b[0m');

      vulnerable.forEach(result => {
        console.log(`\x1b[31m• ${result.ip}:${result.port}\x1b[0m - ${result.details}`);
      });

      console.log('\x1b[31m' + '='.repeat(50) + '\x1b[0m\n');
    }
  }

  static generateOutputFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `results/clawdbot-scan-${timestamp}.txt`;
  }
}
