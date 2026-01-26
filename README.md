# lobster-hunter 🦞

A TypeScript CLI tool for scanning network ranges to detect insecure [ClawdBot](https://clawd.bot) Gateway installations that lack proper authentication.

## Purpose

This tool helps identify ClawdBot Gateway instances that are **publicly accessible without authentication**, which is a security risk. It performs:

1. **WebSocket Connection Test** - Attempts to connect without credentials
2. **Authentication Check** - Verifies if the instance requires auth (401/403)
3. **Classification** - Reports instances as VULNERABLE, SECURED, OPEN, or CLOSED

**Primary Use Cases:**
- Security audits of your own ClawdBot deployments
- Infrastructure security assessments
- Identifying misconfigured instances before attackers do
- Compliance and security posture verification

## Responsible Use

This tool performs active network scanning:
- Ensure you have authorization to scan target systems
- Use for security audits of infrastructure you own or manage
- Respect network policies and rate limits
- Report findings responsibly to system owners

For ClawdBot security documentation, see: https://clawd.bot

## Overview

lobster-hunter scans IP addresses and ranges to identify ClawdBot Gateway instances that accept WebSocket connections without requiring authentication.

## Features

- Scan single IPs, CIDR ranges, or IP ranges
- TCP connection verification
- WebSocket authentication check
- Concurrent scanning with configurable limits
- Progress tracking and real-time results
- TXT and JSON output formats
- Graceful interrupt handling (Ctrl+C saves results)

## Installation

### For Users

```bash
# Install globally from NPM
npm install -g lobster-hunter

# Run the CLI
lobster-hunter 192.168.1.0/24

# Or use with npx (no installation required)
npx lobster-hunter 192.168.1.0/24
npx lobster-hunter 127.0.0.1 -v
npx lobster-hunter -f targets.txt -o results.txt
```

### For Development

```bash
# Clone repository
git clone https://github.com/freema/lobster-hunter.git
cd lobster-hunter

# Install dependencies
npm install

# Build
npm run build

# Create global link
npm link
```

### Using Task (Recommended for Development)

This project uses [Task](https://taskfile.dev) for common operations:

```bash
# Install Task (if not already installed)
# macOS
brew install go-task

# Linux
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# Windows
choco install go-task

# Show available tasks
task --list

# Common tasks
task install     # Install dependencies
task build       # Build project
task test        # Run all checks
task scan        # Test scan on localhost
task link        # Create global npm link
```

## Usage

### Basic Examples

```bash
# Scan a single IP
lobster-hunter 192.168.1.100
# or with npx
npx lobster-hunter 192.168.1.100

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

# Quick scan with npx (no installation)
npx lobster-hunter 127.0.0.1 -v
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

### Using Task (Recommended)

```bash
task install          # Install dependencies
task build            # Build TypeScript
task dev              # Run in development mode
task test             # Run all checks (typecheck, lint, format)
task lint             # Run ESLint
task format           # Format code with Prettier
task scan             # Test scan on localhost
```

### Using NPM Scripts

```bash
npm install           # Install dependencies
npm run dev -- 127.0.0.1  # Run in development mode
npm run build         # Build TypeScript
npm start -- 127.0.0.1    # Run built version
npm test              # Run all checks
npm run lint          # ESLint
npm run format        # Prettier
```

### Release Process

```bash
# Using Task
task test             # Ensure all checks pass
task release:patch    # Create patch release (1.0.0 -> 1.0.1)
git push && git push --tags  # Push to GitHub

# Using NPM
npm test              # Ensure all checks pass
npm version patch     # Bump version
git push && git push --tags  # Trigger release
```

GitHub Actions will automatically:
- Run tests
- Build project
- Publish to NPM
- Create GitHub Release
- Send Pushover notification

## Usage Notes

### What This Tool Does

lobster-hunter performs active network scanning by:
- Attempting WebSocket connections to specified IP addresses
- Testing if ClawdBot Gateway requires authentication
- Identifying potentially insecure instances

### Recommended Scenarios

**✅ Good use cases:**
- Security audits of your own ClawdBot infrastructure
- Verifying proper authentication on your deployments
- Infrastructure compliance checks
- Pre-deployment security validation
- Internal security assessments
- Localhost testing (`127.0.0.1`)

**⚠️ Ensure authorization for:**
- Corporate network scans (get IT approval)
- Cloud infrastructure (verify ToS compliance)
- Third-party systems (written permission required)
- Bug bounty programs (follow scope rules)

### Best Practices

1. **Start small** - Test on localhost first
2. **Verify scope** - Double-check IP ranges before scanning
3. **Rate limiting** - Use appropriate concurrency settings
4. **Documentation** - Keep records of authorization
5. **Responsible disclosure** - Report vulnerabilities properly
6. **Monitor scans** - Watch for unexpected results

### Performance Considerations

- Use lower concurrency (`-c 10`) to avoid overwhelming networks
- Adjust timeout (`-t 5`) based on network conditions
- For large ranges, consider scanning during off-peak hours
- Results are saved to `results/` directory (gitignored)

## License

MIT

## Author

Created for security research and authorized penetration testing purposes.
