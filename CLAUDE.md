# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP Astronomical Time Server is a Model Context Protocol (MCP) server providing 18 tools for time, astronomy, holidays, and productivity features. Built as a single TypeScript file with enterprise-grade security features including rate limiting, request monitoring, and DDoS protection.

## Development Commands

```bash
# Development with hot reload
npm run dev

# Build TypeScript to dist/
npm run build

# Run production build
npm start

# Code formatting and linting
npm run format
npm run lint
```

## Testing

✅ **Complete Jest test suite implemented** with TypeScript support:

### Test Commands
```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure
- **Unit tests**: Core calculations (rate limiting, astronomical, holidays)
- **Integration tests**: API calls with mocked responses
- **Coverage reporting**: HTML and LCOV reports in `coverage/`
- **Pre-commit hooks**: Automatic testing on git commits

### Test Files
- `src/__tests__/rateLimiter.test.ts` - Rate limiting logic
- `src/__tests__/astronomical.test.ts` - Sun/moon calculations  
- `src/__tests__/holidays.test.ts` - Dutch holiday calculations
- `src/__tests__/api.integration.test.ts` - API integration tests

### CI/CD Pipeline
- **GitHub Actions**: Automated testing on push/PR
- **Multi-version testing**: Node.js 18.x, 20.x, 22.x
- **Security audits**: Dependency vulnerability scanning
- **Docker testing**: Container build verification

## Architecture

### Core Structure
- **Single-file implementation**: `src/index.ts` (1768 lines)
- **MCP Server Framework**: Built on `@modelcontextprotocol/sdk` with stdio transport
- **Key Classes**:
  - `RateLimiter`: DDoS protection (100 requests/15min, 20/min)
  - `RequestMonitor`: Usage analytics and performance metrics
  - `DutchCalendar`: Offline Dutch holiday calculations
  - `InternationalHolidays`: API integration with Nager.Date
  - `AstronomicalCalculator`: Sun/moon position calculations
  - `CircadianCalculator`: Biorhythm and jet lag algorithms
  - `ProductivityTimer`: Pomodoro technique implementation
  - `MeetingScheduler`: Multi-timezone coordination

### Data Sources
- **Astronomical calculations**: Offline using Julian day algorithms
- **Dutch holidays**: Calculated offline using Easter algorithm
- **International holidays**: Nager.Date API (free, no API key required)
- **Timezone data**: Node.js built-in Intl API

## Docker Integration

The server is designed to run in Docker for Claude Desktop integration:

```bash
# Run server
docker run -it ghcr.io/hasecon/mcp-astronomical-time-server:latest

# Claude Desktop config
{
  "mcpServers": {
    "astronomical-time": {
      "command": "docker",
      "args": ["run", "-i", "ghcr.io/hasecon/mcp-astronomical-time-server:latest"]
    }
  }
}
```

## Technical Notes

- **TypeScript**: ES2022/ESNext modules, requires Node.js >= 18.0.0
- **Dependencies**: Minimal - only MCP SDK for runtime
- **Security**: Rate limiting, request monitoring, memory management with automatic cleanup
- **Refactoring consideration**: Large single file could benefit from modularization
- **Missing configs**: ESLint/Prettier configuration files not present

## Resolved Issues

✅ **TypeScript build issues fixed**: All TypeScript compilation errors have been resolved:
- Added proper type interfaces for API responses (Holiday, Country)
- Fixed argument destructuring with proper type casting
- Added error type handling with proper casting
- Fixed date formatting parameter types

**Status**: 
- ✅ `npm run build` works
- ✅ Docker container build works 
- ✅ `npm run dev` works

Production deployment is now possible.