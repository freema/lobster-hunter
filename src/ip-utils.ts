export function expandIPRange(input: string): string[] {
  input = input.trim();

  if (input.includes('/')) {
    return expandCIDR(input);
  }

  if (input.includes('-')) {
    return expandDashRange(input);
  }

  if (!validateIP(input)) {
    throw new Error(`Invalid IP address: ${input}`);
  }

  return [input];
}

function expandCIDR(cidr: string): string[] {
  const [baseIP, prefixLenStr] = cidr.split('/');
  const prefixLen = parseInt(prefixLenStr, 10);

  if (prefixLen < 0 || prefixLen > 32) {
    throw new Error(`Invalid CIDR prefix length: ${prefixLen}`);
  }

  const ipNum = ipToNumber(baseIP);
  const hostBits = 32 - prefixLen;
  const numHosts = Math.pow(2, hostBits);

  const networkAddress = ipNum & (~0 << hostBits);

  const results: string[] = [];
  for (let i = 0; i < numHosts; i++) {
    results.push(numberToIP(networkAddress + i));
  }

  return results;
}

function expandDashRange(range: string): string[] {
  // Support both formats:
  // 192.168.1.1-192.168.1.50
  // 192.168.1.1-50

  const fullMatch = range.match(/^(\d+\.\d+\.\d+\.)(\d+)-(\d+\.\d+\.\d+\.)(\d+)$/);
  if (fullMatch) {
    const [, startPrefix, startLast, endPrefix, endLast] = fullMatch;

    if (startPrefix !== endPrefix) {
      throw new Error(`IP range must be in the same subnet: ${range}`);
    }

    const start = parseInt(startLast, 10);
    const end = parseInt(endLast, 10);

    if (start > end || start < 0 || end > 255) {
      throw new Error(`Invalid IP range: ${range}`);
    }

    const results: string[] = [];
    for (let i = start; i <= end; i++) {
      results.push(`${startPrefix}${i}`);
    }
    return results;
  }

  const shortMatch = range.match(/^(\d+\.\d+\.\d+\.)(\d+)-(\d+)$/);
  if (shortMatch) {
    const [, prefix, startStr, endStr] = shortMatch;
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);

    if (start > end || start < 0 || end > 255) {
      throw new Error(`Invalid IP range: ${range}`);
    }

    const results: string[] = [];
    for (let i = start; i <= end; i++) {
      results.push(`${prefix}${i}`);
    }
    return results;
  }

  throw new Error(
    `Invalid IP range format: ${range}. Use format: 192.168.1.1-50 or 192.168.1.1-192.168.1.50`
  );
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => p < 0 || p > 255 || isNaN(p))) {
    throw new Error(`Invalid IP address: ${ip}`);
  }
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function numberToIP(num: number): string {
  return [(num >>> 24) & 0xff, (num >>> 16) & 0xff, (num >>> 8) & 0xff, num & 0xff].join('.');
}

export function validateIP(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === num.toString();
  });
}
