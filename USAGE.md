# lobster-hunter Usage Guide

## ⚠️ Read This First

**This tool sends REAL network requests!** Only scan systems you own or have explicit permission to test. Unauthorized scanning may be illegal in your jurisdiction.

## Quick Start

After building the project, you can use the tool in several ways:

### 1. Using npm link (recommended for development)

```bash
npm install
npm run build
npm link

# Now you can use the command globally
lobster-hunter 192.168.1.0/24
```

### 2. Direct node execution

```bash
npm install
npm run build
node dist/index.js 192.168.1.0/24
```

### 3. Development mode with tsx

```bash
npm install
npm run dev -- 192.168.1.0/24
```

## Common Scan Patterns

### Single IP Scan
```bash
lobster-hunter 192.168.1.100
```

### CIDR Range Scan
```bash
# Scan entire /24 subnet (256 addresses)
lobster-hunter 10.0.0.0/24

# Scan /16 subnet (65,536 addresses - this will take a while!)
lobster-hunter 10.0.0.0/16 -c 200

# Common private ranges
lobster-hunter 192.168.0.0/24
lobster-hunter 172.16.0.0/24
lobster-hunter 10.0.0.0/24
```

### IP Range Scan
```bash
# Scan IPs from .1 to .50 (full format)
lobster-hunter 192.168.1.1-192.168.1.50

# Scan IPs from .1 to .50 (short format)
lobster-hunter 192.168.1.1-50

# Scan IPs from .100 to .200
lobster-hunter 10.0.0.100-10.0.0.200
```

### File-Based Scanning
```bash
# Create targets file
cat > targets.txt << 'EOF'
# Production servers
192.168.1.100
192.168.1.101

# Development subnet
10.0.0.0/24

# Specific range
172.16.0.1-172.16.0.50
EOF

# Scan from file
lobster-hunter -f targets.txt
```

## Advanced Options

### Custom Port
```bash
# Scan custom port instead of default 18789
lobster-hunter 192.168.1.0/24 -p 8080
```

### Timeout Configuration
```bash
# Reduce timeout for faster scans (may miss slow hosts)
lobster-hunter 192.168.1.0/24 -t 1

# Increase timeout for slow networks
lobster-hunter 192.168.1.0/24 -t 10
```

### Concurrency Tuning
```bash
# Lower concurrency for rate limiting
lobster-hunter 192.168.1.0/24 -c 10

# Higher concurrency for faster scans
lobster-hunter 192.168.1.0/24 -c 200
```

### Output Options
```bash
# Specify output file (still in results/ folder)
lobster-hunter 192.168.1.0/24 -o results/my-scan.txt

# Generate both TXT and JSON output
lobster-hunter 192.168.1.0/24 --json

# Verbose mode (show all hosts including closed ports)
lobster-hunter 192.168.1.0/24 -v
```

**Note:** All scan results are automatically saved to the `results/` directory. This folder is in `.gitignore` to prevent accidental commits of sensitive scan data.

## Combining Options

```bash
# Full-featured scan
lobster-hunter 192.168.1.0/24 \
  -p 18789 \
  -t 5 \
  -c 100 \
  -o my-scan.txt \
  --json \
  -v

# Fast scan with reduced timeout and high concurrency
lobster-hunter 10.0.0.0/24 -t 1 -c 200

# Careful scan with low concurrency and high timeout
lobster-hunter 192.168.1.0/24 -t 10 -c 10 -v
```

## Understanding Results

### Status Codes

| Status | Color | Meaning | Action Required |
|--------|-------|---------|-----------------|
| VULNERABLE | Red | No auth required - WebSocket connection succeeded | **CRITICAL** - Immediate remediation needed |
| SECURED | Green | Auth enabled (401/403) | Good - properly configured |
| OPEN | Yellow | Port open but status unclear | Investigate further |
| CLOSED | Gray | Port not responding | No ClawdBot installation found |

### Example Output

```
[VULNERABLE]   192.168.1.15:18789 - No authentication required! (124ms)
[VULNERABLE]   192.168.1.42:18789 - No authentication required! (98ms)
[SECURED]      192.168.1.100:18789 - Auth enabled (401) (56ms)
[OPEN]         192.168.1.150:18789 - HTTP 404 (45ms)

Progress: 254/254 (100.0%)

==================================================
SCAN SUMMARY
==================================================
Total scanned:  254
Vulnerable:     2     ← FIX THESE IMMEDIATELY
Secured:        1     ← Good
Open:           1     ← Investigate
Closed:         250   ← No ClawdBot found
Duration:       45.32s
==================================================

⚠️  WARNING: Found 2 vulnerable host(s) with no authentication!
```

## Interrupting Scans

You can safely interrupt a scan with `Ctrl+C`. The tool will:
1. Stop scanning immediately
2. Save all results collected so far
3. Generate a partial report

```bash
lobster-hunter 10.0.0.0/16  # Large scan

# Press Ctrl+C after a few seconds
^C
Scan interrupted. Saving results...
Results saved to: clawdbot-scan-2026-01-26T12-30-00.txt
```

## Performance Tips

### Large Scans (> 1000 hosts)

```bash
# Increase concurrency and reduce timeout
lobster-hunter 10.0.0.0/16 -t 2 -c 500 -o large-scan.txt
```

### Network with Rate Limiting

```bash
# Reduce concurrency to avoid triggering IDS/IPS
lobster-hunter 192.168.1.0/24 -c 5 -t 10
```

### Estimating Scan Time

Approximate formula: `(hosts × timeout) / concurrency`

- 256 hosts, 3s timeout, 50 concurrency = ~15 seconds
- 65,536 hosts, 3s timeout, 200 concurrency = ~16 minutes
- 1,000 hosts, 5s timeout, 100 concurrency = ~50 seconds

## Output Files

### TXT Format (Human-readable)

```
# ClawdBot Scan Results
# Date: 2026-01-26 12:00:00
# Target: 10.0.0.0/24
# Port: 18789

[VULNERABLE]   10.0.0.15:18789         - No authentication required!
[SECURED]      10.0.0.100:18789        - Auth enabled (401)

---
Summary:
Total scanned: 254
Vulnerable: 1
Secured: 1
```

### JSON Format (Machine-readable)

```json
{
  "summary": {
    "total": 254,
    "vulnerable": 1,
    "secured": 1,
    "duration": 45.32
  },
  "results": [
    {
      "ip": "10.0.0.15",
      "port": 18789,
      "status": "VULNERABLE",
      "details": "No authentication required!",
      "responseTime": 124,
      "timestamp": "2026-01-26T12:00:00.000Z"
    }
  ]
}
```

## Troubleshooting

### Permission Denied

```bash
# On macOS/Linux, you may need sudo for some operations
sudo lobster-hunter 192.168.1.0/24
```

### Command Not Found (after npm link)

```bash
# Rebuild and relink
npm run build
npm link

# Or use direct execution
node dist/index.js 192.168.1.0/24
```

### Slow Scans

```bash
# Increase concurrency
lobster-hunter 192.168.1.0/24 -c 200

# Reduce timeout
lobster-hunter 192.168.1.0/24 -t 1
```

### Too Many False Positives

```bash
# Increase timeout for more accurate results
lobster-hunter 192.168.1.0/24 -t 10 -v
```

## Security Best Practices

### Before Scanning

1. **Get written authorization** - email, contract, or bug bounty rules
2. **Verify IP ranges** - double-check you're scanning the right targets
3. **Test on localhost first** - `lobster-hunter 127.0.0.1` to verify setup

### During Scanning

4. **Use appropriate concurrency** - don't DoS the network
5. **Monitor for issues** - be ready to stop if problems occur
6. **Scan during maintenance windows** when possible for production systems

### After Scanning

7. **Store results securely** - `results/` folder contains sensitive data
8. **Don't commit scan results** - already in `.gitignore`
9. **Report findings properly** - follow responsible disclosure
10. **Delete old scans** - `rm -rf results/*` when no longer needed

### What NOT to Scan

❌ Public internet ranges without authorization (e.g., `185.8.164.0/24`)
❌ Cloud provider networks (AWS, Azure, GCP, etc.)
❌ Government or educational networks
❌ Your ISP's infrastructure
❌ Anything you don't own or have written permission to test

### What's SAFE to Scan

✅ `127.0.0.1` or `127.0.0.0/8` - Your localhost
✅ Your own VPS/dedicated servers
✅ Your home network (if you're the owner)
✅ Company network with IT department approval
✅ Bug bounty program targets within scope
✅ CTF competition infrastructure

## Integration with Other Tools

### Export to CSV for Excel

```bash
# Scan and generate JSON
lobster-hunter 192.168.1.0/24 --json -o scan.txt

# Convert JSON to CSV (using jq)
jq -r '.results[] | [.ip, .port, .status, .details] | @csv' scan.json > scan.csv
```

### Pipe to grep for filtering

```bash
# Show only vulnerable hosts
cat clawdbot-scan-*.txt | grep VULNERABLE

# Count vulnerable hosts
cat clawdbot-scan-*.txt | grep -c VULNERABLE
```

### Use with watch for continuous monitoring

```bash
# Scan every 5 minutes
watch -n 300 'lobster-hunter 192.168.1.0/24 -o latest-scan.txt'
```

## Examples from Real-World Scenarios

### Internal Network Audit

```bash
# Scan all three common private ranges
lobster-hunter 192.168.0.0/16 -c 200 -o internal-audit.txt --json
lobster-hunter 172.16.0.0/12 -c 200 -o internal-audit-2.txt --json
lobster-hunter 10.0.0.0/8 -c 500 -t 2 -o internal-audit-3.txt --json
```

### Pre-Production Security Check

```bash
# Scan staging environment before go-live
lobster-hunter -f staging-servers.txt -v -o pre-prod-check.txt
```

### Compliance Scanning

```bash
# Monthly compliance scan with documentation
lobster-hunter -f production-servers.txt \
  -o "compliance-scan-$(date +%Y-%m).txt" \
  --json \
  -v
```

## Need Help?

```bash
lobster-hunter --help
```
