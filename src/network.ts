import WebSocket from 'ws';
import type { ScanResult } from './types.js';

export async function checkWebSocketAuth(
  ip: string,
  port: number,
  timeout: number
): Promise<Pick<ScanResult, 'status' | 'details' | 'responseTime'>> {
  const startTime = Date.now();

  return new Promise(resolve => {
    const wsUrl = `ws://${ip}:${port}`;
    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          status: 'OPEN',
          details: 'Connection timeout',
          responseTime: Date.now() - startTime,
        });
      }
    }, timeout * 1000);

    try {
      const ws = new WebSocket(wsUrl, {
        handshakeTimeout: timeout * 1000,
        headers: {
          'User-Agent': 'lobster-hunter/1.0',
        },
      });

      ws.on('open', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          ws.close();
          resolve({
            status: 'VULNERABLE',
            details: 'No authentication required!',
            responseTime: Date.now() - startTime,
          });
        }
      });

      ws.on('error', (error: Error & { code?: string }) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);

          const errorMessage = error.message.toLowerCase();

          if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
            resolve({
              status: 'SECURED',
              details: 'Auth enabled (401)',
              responseTime: Date.now() - startTime,
            });
          } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
            resolve({
              status: 'SECURED',
              details: 'Auth enabled (403)',
              responseTime: Date.now() - startTime,
            });
          } else if (errorMessage.includes('econnrefused')) {
            resolve({
              status: 'CLOSED',
              details: 'Connection refused',
              responseTime: Date.now() - startTime,
            });
          } else {
            resolve({
              status: 'OPEN',
              details: `Error: ${error.message}`,
              responseTime: Date.now() - startTime,
            });
          }
        }
      });

      ws.on('unexpected-response', (_request, response) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          ws.terminate();

          const statusCode = response.statusCode;

          if (statusCode === 401 || statusCode === 403) {
            resolve({
              status: 'SECURED',
              details: `Auth enabled (${statusCode})`,
              responseTime: Date.now() - startTime,
            });
          } else if (statusCode === 101) {
            resolve({
              status: 'VULNERABLE',
              details: 'No authentication required!',
              responseTime: Date.now() - startTime,
            });
          } else {
            resolve({
              status: 'OPEN',
              details: `HTTP ${statusCode}`,
              responseTime: Date.now() - startTime,
            });
          }
        }
      });
    } catch (error) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve({
          status: 'OPEN',
          details: `Exception: ${error instanceof Error ? error.message : String(error)}`,
          responseTime: Date.now() - startTime,
        });
      }
    }
  });
}

export async function scanHost(
  ip: string,
  port: number,
  timeout: number,
  verbose: boolean
): Promise<ScanResult> {
  if (verbose) {
    console.log(`Scanning ${ip}:${port}...`);
  }

  const wsResult = await checkWebSocketAuth(ip, port, timeout);

  return {
    ip,
    port,
    ...wsResult,
    timestamp: new Date(),
  };
}
