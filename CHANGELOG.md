# Changelog

All notable changes to lobster-hunter will be documented in this file.

## [1.0.1] - 2026-01-26

### Changed
- Enhanced README with npx usage examples
- Improved documentation for users who don't want to install globally

### Fixed
- GitHub Actions release workflow now triggers on tags without 'v' prefix (1.0.1 instead of v1.0.1)

## [1.0.0] - 2026-01-26

### Added
- Initial release of lobster-hunter CLI tool
- Network scanning for ClawdBot installations
- Support for single IPs, CIDR ranges, and IP ranges
- WebSocket authentication detection
- Color-coded console output
- TXT and JSON report generation
- Public IP warning system
- Results auto-save to `results/` directory
- ESLint and Prettier configuration
- GitHub Actions CI/CD workflows
- Comprehensive documentation (README, USAGE)

### Code Quality Improvements (Post-CR)
- **Performance**: Removed redundant TCP check before WebSocket connection (scans are now ~2x faster)
- **Error Handling**: Added ERROR status to track and report failed scans in summary
- **Type Safety**: Fixed all ESLint warnings, added proper TypeScript types for CLI options
- **Code Reuse**: Extracted `createSummary()` helper to avoid duplicated logic
- **Data Integrity**: Fixed in-place sorting that modified original results array
- **Validation**: Added IP validation using existing `validateIP()` function

### Security
- Public IP address scanning warnings
- Legal disclaimer in documentation
- Private IP range detection (RFC 1918, loopback, link-local)

### Supported Formats
- Single IP: `192.168.1.100`
- CIDR /24: `10.0.0.0/24` (256 addresses)
- CIDR /16: `10.0.0.0/16` (65,536 addresses)
- IP range (full): `192.168.1.1-192.168.1.50`
- IP range (short): `192.168.1.1-50`
- Target files: Read from file with mixed formats

### Detection Logic
- `VULNERABLE` - WebSocket connects without authentication (101)
- `SECURED` - Returns 401/403 (authentication required)
- `OPEN` - Port open but status unclear
- `CLOSED` - Connection refused (ECONNREFUSED)
- `ERROR` - Scan failed due to exception

### Output
- Console: Color-coded real-time results
- TXT: Human-readable report with summary
- JSON: Machine-readable format (optional with `--json`)
- All results saved to `results/` directory (gitignored)

## Technical Details

### Dependencies
- `commander`: CLI argument parsing
- `ws`: WebSocket client library
- `typescript`: Type safety
- `eslint`: Code linting
- `prettier`: Code formatting

### Development
```bash
npm install          # Install dependencies
npm run build        # Build TypeScript
npm run dev          # Development mode
npm run lint         # Lint code
npm run format       # Format code
npm test             # Run all checks
```

### CI/CD
- Automated testing on Node.js 20.x and 22.x
- Type checking, linting, and formatting validation
- Security audit with npm audit
- Automated releases on git tags
