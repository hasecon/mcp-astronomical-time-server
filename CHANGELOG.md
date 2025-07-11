# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-07-11

### ✨ Added

#### Core Features
- **MCP Astronomical Time Server** - Complete Model Context Protocol implementation
- **Rate Limiting & DDoS Protection** - Enterprise-grade request limiting (100/15min, 20/min)
- **Request Monitoring** - Real-time usage analytics and performance metrics

#### ⏰ Time & Timezone Management
- `get_current_time` - Current time in multiple formats (ISO, human, unix)
- `convert_timezone` - Convert time between any timezones
- `time_until` - Calculate time until specific date/time
- `world_clock` - Multi-city world clock display
- `calculate_days_between` - Detailed time calculations between dates
- `countdown_to_event` - Real-time countdown with urgency indicators

#### ☀️ Astronomical Calculations
- `get_sun_info` - Sunrise, sunset, solar noon calculations
- `get_moon_info` - Moon phase calculations with Dutch names
- `get_astronomical_info` - Comprehensive astronomical data for any location
- `get_golden_hour` - Golden hour and blue hour times for photography

#### 🎉 Holiday Management
- `get_dutch_holidays` - Complete Dutch national holidays (offline)
- `get_international_holidays` - 100+ countries via Nager.Date API
- `get_available_countries` - List all supported countries
- `compare_holidays` - Compare holidays between multiple countries
- `calculate_workdays` - Working days calculator (excludes weekends & holidays)

#### 🧬 Productivity & Wellness
- `get_circadian_schedule` - Optimal daily schedule based on sunrise
- `calculate_jetlag` - Jet lag recovery calculator with scientific tips
- `create_pomodoro_schedule` - Pomodoro technique planning (25min work + 5min break)
- `find_meeting_time` - International team meeting coordinator

#### 📊 Server Management
- `get_server_stats` - Performance statistics and usage metrics
- Health checks and monitoring
- Graceful error handling with user-friendly messages

### 🛡️ Security Features
- Multi-layer DDoS protection
- Rate limiting with automatic cleanup
- Non-root Docker container execution
- Read-only filesystem in production
- Security headers and best practices

### 🐳 DevOps & Deployment
- **Docker Support** - Multi-stage Dockerfile with Alpine Linux
- **Docker Compose** - Production-ready configuration with resource limits
- **GitHub Actions** - Complete CI/CD pipeline with security scanning
- **Container Registry** - Automatic builds to GitHub Container Registry
- **Security Scanning** - Trivy vulnerability scanning for code and containers

### 📚 Documentation
- Comprehensive README with usage examples
- API documentation for all 18 tools
- Contributing guidelines with code of conduct
- Deployment guides for Docker and cloud platforms
- Security documentation and best practices

### 🌍 International Support
- Support for 100+ countries for holiday data
- Intelligent country name recognition (Dutch, English, ISO codes)
- Timezone support for all major cities worldwide
- Multi-language time formatting

### 🎯 Productivity Features
- Circadian rhythm optimization based on actual sunrise times
- Science-based jet lag recovery calculations
- International team meeting coordination
- Pomodoro technique implementation
- Dutch business calendar integration

### 🔧 Technical Improvements
- TypeScript implementation for type safety
- ESM module support
- Comprehensive error handling
- Memory-efficient rate limiting
- Automatic cleanup routines
- Performance optimizations

## Supported Countries

The server supports holiday data for 100+ countries including:

🇳🇱 Netherlands • 🇩🇪 Germany • 🇫🇷 France • 🇬🇧 United Kingdom • 🇺🇸 United States • 🇮🇹 Italy • 🇪🇸 Spain • 🇧🇪 Belgium • 🇨🇭 Switzerland • 🇦🇹 Austria • 🇩🇰 Denmark • 🇸🇪 Sweden • 🇳🇴 Norway • 🇫🇮 Finland • 🇵🇱 Poland • 🇨🇦 Canada • 🇦🇺 Australia • 🇳🇿 New Zealand • 🇯🇵 Japan • 🇰🇷 South Korea • 🇨🇳 China • 🇮🇳 India • 🇧🇷 Brazil • 🇷🇺 Russia

## Dependencies

- `@modelcontextprotocol/sdk` ^0.4.0 - MCP protocol implementation
- `@types/node` ^20.0.0 - Node.js type definitions
- `typescript` ^5.0.0 - TypeScript compiler
- `tsx` ^4.0.0 - TypeScript execution environment

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Model Context Protocol
- [Nager.Date](https://date.nager.at/) for international holiday data
- [Node.js](https://nodejs.org/) and [TypeScript](https://www.typescriptlang.org/) communities

---

## Migration Guide

This is the initial release (v2.0.0), so no migration is needed.

For future versions, breaking changes will be documented here with migration instructions.

## Support

- 📚 [Documentation](https://github.com/hasecon/mcp-astronomical-time-server#readme)
- 🐛 [Issues](https://github.com/hasecon/mcp-astronomical-time-server/issues)
- 💬 [Discussions](https://github.com/hasecon/mcp-astronomical-time-server/discussions)
- 📧 Email: support@hasecon.nl