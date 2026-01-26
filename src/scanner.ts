import { scanHost } from './network.js';
import type { ScanResult, ScanOptions, ScanSummary } from './types.js';
import { createSummary } from './types.js';

export class Scanner {
  private results: ScanResult[] = [];
  private scannedCount = 0;
  private totalTargets = 0;

  constructor(private options: ScanOptions) {}

  async scanTargets(targets: string[]): Promise<{ results: ScanResult[]; summary: ScanSummary }> {
    this.totalTargets = targets.length;
    this.scannedCount = 0;
    this.results = [];

    const startTime = new Date();

    console.log(`\nStarting scan of ${this.totalTargets} target(s)...`);
    console.log(`Port: ${this.options.port}`);
    console.log(`Timeout: ${this.options.timeout}s`);
    console.log(`Concurrency: ${this.options.concurrency}\n`);

    await this.scanWithConcurrency(targets);

    const endTime = new Date();

    const summary = createSummary(
      this.results,
      startTime,
      endTime,
      `${this.totalTargets} target(s)`
    );

    return { results: this.results, summary };
  }

  private async scanWithConcurrency(targets: string[]): Promise<void> {
    const queue = [...targets];
    const workers: Promise<void>[] = [];

    const worker = async () => {
      while (queue.length > 0) {
        const target = queue.shift();
        if (!target) break;

        try {
          const result = await scanHost(
            target,
            this.options.port,
            this.options.timeout,
            this.options.verbose
          );

          this.results.push(result);
          this.scannedCount++;

          this.printResult(result);
          this.printProgress();
        } catch (error) {
          const errorResult: ScanResult = {
            ip: target,
            port: this.options.port,
            status: 'ERROR',
            details: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          };

          this.results.push(errorResult);
          this.scannedCount++;

          if (this.options.verbose) {
            console.error(
              `\x1b[31m[ERROR     ]\x1b[0m ${target}:${this.options.port} - ${errorResult.details}`
            );
          }
          this.printProgress();
        }
      }
    };

    for (let i = 0; i < this.options.concurrency; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
  }

  private printResult(result: ScanResult): void {
    const statusColors = {
      VULNERABLE: '\x1b[31m',
      SECURED: '\x1b[32m',
      OPEN: '\x1b[33m',
      CLOSED: '\x1b[90m',
      ERROR: '\x1b[31m',
    };

    const reset = '\x1b[0m';
    const color = statusColors[result.status];

    const timeStr = result.responseTime ? ` (${result.responseTime}ms)` : '';

    if (result.status !== 'CLOSED' || this.options.verbose) {
      // Special alert for VULNERABLE instances
      if (result.status === 'VULNERABLE') {
        console.log('');
        console.log('\x1b[41m\x1b[97m                                                    \x1b[0m');
        console.log(`\x1b[41m\x1b[97m ⚠️  VULNERABLE INSTANCE FOUND!                     \x1b[0m`);
        console.log('\x1b[41m\x1b[97m                                                    \x1b[0m');
        console.log(
          `${color}[${result.status.padEnd(10)}]${reset} ${result.ip}:${result.port} - ${result.details}${timeStr}`
        );
        console.log('\x1b[33m→ No authentication required - immediate action needed!\x1b[0m');
        console.log('');
      } else {
        console.log(
          `${color}[${result.status.padEnd(10)}]${reset} ${result.ip}:${result.port} - ${result.details}${timeStr}`
        );
      }
    }
  }

  private printProgress(): void {
    const percent = ((this.scannedCount / this.totalTargets) * 100).toFixed(1);
    process.stdout.write(`\rProgress: ${this.scannedCount}/${this.totalTargets} (${percent}%)    `);

    if (this.scannedCount === this.totalTargets) {
      console.log('\n');
    }
  }

  getResults(): ScanResult[] {
    return this.results;
  }
}
