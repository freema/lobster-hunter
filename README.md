# lobster-hunter 🦞

A TypeScript CLI tool for scanning network ranges to detect insecure ClawdBot Gateway installations that lack proper authentication.

## ⚠️ LEGAL WARNING

**This tool sends REAL network requests to the specified IP addresses!**

- ❌ **DO NOT** scan networks you don't own or have explicit permission to test
- ❌ **DO NOT** scan public internet ranges without authorization
- ❌ Unauthorized network scanning may be **ILLEGAL** in your jurisdiction
- ✅ **ONLY USE** on your own systems, with written authorization, or in authorized security testing

**You are responsible for ensuring you have proper authorization before using this tool.**

## Overview

lobster-hunter scans IP addresses and ranges to identify ClawdBot Gateway instances that accept WebSocket connections without requiring authentication. This tool is designed for authorized security assessments and penetration testing.

## Features

- Scan single IPs, CIDR ranges, or IP ranges
- TCP connection verification
- WebSocket authentication check
- Concurrent scanning with configurable limits
- Progress tracking and real-time results
- TXT and JSON output formats
- Graceful interrupt handling (Ctrl+C saves results)

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Examples

```bash
# Scan a single IP
lobster-hunter 192.168.1.100

# Scan a CIDR range (256 addresses)
lobster-hunter 10.0.0.0/24

# Scan an IP range - full format
lobster-hunter 192.168.1.1-192.168.1.50

# Scan an IP range - short format
lobster-hunter 192.168.1.1-50

# Scan from a file with custom options
lobster-hunter -f targets.txt -p 18789 -t 5 -c 100 -o my-results.txt

# Enable verbose output and JSON export
lobster-hunter 10.0.0.0/24 -v --json
```

**Note:** Results are automatically saved to the `results/` directory.

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --port <number>` | Port to scan | 18789 |
| `-t, --timeout <seconds>` | Connection timeout | 3 |
| `-c, --concurrency <num>` | Max concurrent connections | 50 |
| `-o, --output <file>` | Output TXT file path | `results/clawdbot-scan-[timestamp].txt` |
| `-f, --file <file>` | Read targets from file | - |
| `-v, --verbose` | Verbose output (shows closed ports) | false |
| `--json` | Also output JSON file | false |

### Target File Format

Create a text file with one target per line:

```
# targets.txt
# Single IPs
192.168.1.100
192.168.1.200

# CIDR ranges
10.0.0.0/24

# IP ranges (both formats work)
172.16.0.1-172.16.0.50
192.168.1.1-50
```

Lines starting with `#` are treated as comments.

### Supported Target Formats

| Format | Example | Description |
|--------|---------|-------------|
| Single IP | `192.168.1.100` | Scans one IP address |
| CIDR /24 | `10.0.0.0/24` | Scans 256 addresses (x.x.x.0 - x.x.x.255) |
| CIDR /16 | `10.0.0.0/16` | Scans 65,536 addresses (use with caution!) |
| IP range (full) | `192.168.1.1-192.168.1.50` | Scans from first to last IP |
| IP range (short) | `192.168.1.1-50` | Same subnet, scans .1 to .50 |

## Detection Logic

For each target, the scanner:

1. **TCP Check**: Attempts to connect to the specified port
2. **WebSocket Upgrade**: Tries to establish a WebSocket connection without auth
3. **Classification**:
   - `VULNERABLE` - WebSocket connection succeeds (101 Switching Protocols)
   - `SECURED` - Returns 401/403 (authentication required)
   - `OPEN` - Port open but status unclear
   - `CLOSED` - Port not responding

## Output Format

### Console Output

```
[VULNERABLE]   10.0.0.15:18789 - No authentication required! (124ms)
[VULNERABLE]   10.0.0.42:18789 - No authentication required! (98ms)
[SECURED]      10.0.0.100:18789 - Auth enabled (401) (56ms)
[OPEN]         10.0.0.150:18789 - HTTP 404 (45ms)

Progress: 254/254 (100.0%)
```

### TXT Report (saved to `results/` folder)

```
# ClawdBot Scan Results
# Date: 2026-01-26 12:00:00
# Target: 10.0.0.0/24
# Port: 18789

[VULNERABLE]   10.0.0.15:18789         - No authentication required!
[VULNERABLE]   10.0.0.42:18789         - No authentication required!
[SECURED]      10.0.0.100:18789        - Auth enabled (401)
[OPEN]         10.0.0.150:18789        - HTTP 404

---
Summary:
Total scanned: 254
Vulnerable: 2
Secured: 1
Open: 1
Closed: 250

Scan duration: 45.32s
```

Results are saved to `results/clawdbot-scan-[timestamp].txt` (and optionally `.json` with `--json` flag).

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- 127.0.0.1

# Build
npm run build

# Run built version
npm start -- 127.0.0.1
```

## Security & Legal Considerations

### ⚠️ This Tool Sends Real Network Traffic

When you run `lobster-hunter 185.8.164.0/24`, you are:
- Connecting to **256 real servers** on the internet
- Sending TCP and WebSocket requests to each
- Potentially triggering intrusion detection systems
- Creating network logs on remote systems

### Safe Usage Scenarios

✅ **Safe to scan:**
- `127.0.0.1` - Your own computer (localhost)
- Your own servers and infrastructure
- Networks where you are the administrator
- Penetration testing with **written authorization**
- Bug bounty programs within defined scope
- CTF challenges and training labs

❌ **NEVER scan:**
- Public IP ranges without authorization
- Your employer's network without permission
- ISP networks or cloud providers
- Government or military networks
- Any system you don't own or have explicit written permission to test

### Legal Framework

- **Czech Republic:** Unauthorized access to computer systems (§230 trestního zákoníku)
- **EU:** NIS2 Directive, GDPR considerations
- **USA:** Computer Fraud and Abuse Act (CFAA)
- **Worldwide:** Most countries have cybercrime laws prohibiting unauthorized network scanning

### Best Practices

1. **Always get written permission** before scanning
2. **Document your authorization** - keep records
3. **Limit scan scope** to authorized ranges only
4. **Use appropriate timing** - avoid business hours if possible
5. **Monitor your scans** - be ready to stop if issues arise
6. **Report findings properly** - follow responsible disclosure

## License

MIT

## Author

Created for security research and authorized penetration testing purposes.
