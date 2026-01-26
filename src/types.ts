export type ScanStatus = 'VULNERABLE' | 'SECURED' | 'OPEN' | 'CLOSED' | 'ERROR';

export interface ScanResult {
  ip: string;
  port: number;
  status: ScanStatus;
  details: string;
  responseTime?: number;
  timestamp: Date;
}

export interface ScanOptions {
  port: number;
  timeout: number;
  concurrency: number;
  outputFile?: string;
  verbose: boolean;
  jsonOutput: boolean;
}

export interface ScanSummary {
  total: number;
  vulnerable: number;
  secured: number;
  open: number;
  closed: number;
  errors: number;
  startTime: Date;
  endTime: Date;
  targets: string;
}

export function createSummary(
  results: ScanResult[],
  startTime: Date,
  endTime: Date,
  targets: string
): ScanSummary {
  return {
    total: results.length,
    vulnerable: results.filter(r => r.status === 'VULNERABLE').length,
    secured: results.filter(r => r.status === 'SECURED').length,
    open: results.filter(r => r.status === 'OPEN').length,
    closed: results.filter(r => r.status === 'CLOSED').length,
    errors: results.filter(r => r.status === 'ERROR').length,
    startTime,
    endTime,
    targets,
  };
}
