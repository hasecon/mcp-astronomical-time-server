# 🌟 MCP Astronomical Time Server

[![CI/CD Pipeline](https://github.com/hasecon/mcp-astronomical-time-server/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/hasecon/mcp-astronomical-time-server/actions/workflows/ci-cd.yml)
[![Docker Image](https://ghcr.io/hasecon/mcp-astronomical-time-server:latest)](https://github.com/hasecon/mcp-astronomical-time-server/pkgs/container/mcp-astronomical-time-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/mcp-astronomical-time-server)](https://nodejs.org/)

Een krachtige **Model Context Protocol (MCP) server** die geavanceerde tijd, astronomie, feestdagen en productiviteits-functionaliteiten biedt. Perfect voor internationale teams, fotografen, reisplanners en productiviteits-enthusiasten!

## ✨ Features

### ⏰ **Tijd & Timezone Management**
- 🌍 Wereldklok voor meerdere tijdzones
- 🔄 Timezone conversies
- ⏱️ Countdown timers en event planning
- 📅 Nauwkeurige tijd berekeningen tussen datums

### ☀️ **Astronomische Berekeningen** 
- 🌅 Zonsopgang en zonsondergang tijden
- 🌞 Zonnestand tracking (azimuth & hoogte)
- 📸 Golden Hour en Blue Hour voor fotografie
- 🌙 Maanfase berekeningen met Nederlandse namen
- 🌍 Locatie-gebaseerde berekeningen wereldwijd

### 🎉 **Feestdagen & Planning**
- 🇳🇱 Complete Nederlandse feestdagen (offline)
- 🌍 Internationale feestdagen voor 100+ landen
- 💼 Werkdagen calculator (exclusief weekends & feestdagen)
- 🔍 Feestdagen vergelijking tussen landen

### 🧬 **Productiviteit & Welzijn**
- 🧠 Circadiaans ritme optimalisatie
- ✈️ Jet lag calculator met herstel tips
- 🍅 Pomodoro technique scheduler
- 🌐 International meeting time finder
- ⚡ Bioklok-gebaseerde dagplanning

### 🛡️ **Enterprise Ready**
- 🚫 DDoS bescherming en rate limiting
- 📊 Real-time server statistieken
- 🔒 Security best practices
- 🐳 Docker container support
- 📈 Usage analytics en monitoring

## 🚀 Quick Start

### Via Docker (Aanbevolen)

```bash
# Pull en run de container
docker run -it ghcr.io/hasecon/mcp-astronomical-time-server:latest

# Of met Docker Compose
curl -O https://raw.githubusercontent.com/hasecon/mcp-astronomical-time-server/main/docker-compose.yml
docker-compose up -d
```

### Handmatige Installatie

```bash
# Clone de repository
git clone https://github.com/hasecon/mcp-astronomical-time-server.git
cd mcp-astronomical-time-server

# Installeer dependencies
npm install

# Bouw het project
npm run build

# Start de server
npm start
```

### Claude Desktop Integratie

Voeg dit toe aan je Claude Desktop configuratie:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "astronomical-time": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "ghcr.io/hasecon/mcp-astronomical-time-server:latest"
      ]
    }
  }
}
```

Of gecombineerd met andere MCP servers zoals GitHub:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ]
    },
    "astronomical-time": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "ghcr.io/hasecon/mcp-astronomical-time-server:latest"
      ]
    }
  }
}
```

## 📖 Usage Examples

### Basis Tijd Functies
```
"Wat is de huidige tijd in Tokyo?"
→ get_current_time met timezone: "Asia/Tokyo"

"Hoeveel tijd tot Nieuwjaar?"
→ countdown_to_event met target: "2026-01-01T00:00:00Z"
```

### Astronomische Planning
```
"Wanneer is golden hour vandaag in Amsterdam?"
→ get_golden_hour met coords: 52.3676°N, 4.9041°E

"Complete astronomische info voor New York"
→ get_astronomical_info met NYC coordinates
```

### Internationale Teams
```
"Beste vergadertijd voor Amsterdam, San Francisco en Tokyo?"
→ find_meeting_time met deze 3 tijdzones

"Vergelijk feestdagen Nederland, Duitsland en Frankrijk"
→ compare_holidays tussen deze landen
```

### Productiviteit
```
"Optimaal dagschema gebaseerd op zonsopgang Rotterdam?"
→ get_circadian_schedule met Rotterdam coords

"Pomodoro schema vanaf 14:00"
→ create_pomodoro_schedule met start tijd
```

## 🛠️ API Reference

<details>
<summary><strong>📋 Alle Beschikbare Tools (klik om uit te klappen)</strong></summary>

### ⏰ Tijd Functies
- `get_current_time` - Huidige tijd in verschillende formaten
- `convert_timezone` - Tijdzone conversies  
- `time_until` - Tijd tot specifieke datum
- `world_clock` - Wereldklok meerdere steden
- `calculate_days_between` - Dagen tussen datums
- `countdown_to_event` - Real-time countdown

### ☀️🌙 Astronomie
- `get_sun_info` - Zonsopgang/ondergang/positie
- `get_moon_info` - Maanfase en verlichting
- `get_astronomical_info` - Complete astronomische data
- `get_golden_hour` - Fotografie tijden

### 🎉 Feestdagen
- `get_dutch_holidays` - Nederlandse feestdagen
- `get_international_holidays` - Wereldwijde feestdagen
- `get_available_countries` - Beschikbare landen
- `compare_holidays` - Vergelijk tussen landen
- `calculate_workdays` - Werkdagen calculator

### 🧬 Productiviteit
- `get_circadian_schedule` - Bioklok planning
- `calculate_jetlag` - Jet lag recovery
- `create_pomodoro_schedule` - Pomodoro planning
- `find_meeting_time` - Meeting coordinator

### 📊 Server Management
- `get_server_stats` - Server statistieken en status

</details>

## 🌍 Ondersteunde Landen

De server ondersteunt **100+ landen** voor feestdagen via de gratis [Nager.Date API](https://date.nager.at/):

🇳🇱 Nederland • 🇩🇪 Duitsland • 🇫🇷 Frankrijk • 🇬🇧 VK • 🇺🇸 VS • 🇮🇹 Italië • 🇪🇸 Spanje • 🇧🇪 België • 🇨🇭 Zwitserland • 🇦🇹 Oostenrijk • 🇩🇰 Denemarken • 🇸🇪 Zweden • 🇳🇴 Noorwegen • 🇫🇮 Finland • 🇵🇱 Polen • 🇨🇦 Canada • 🇦🇺 Australië • 🇳🇿 Nieuw-Zeeland • 🇯🇵 Japan • 🇰🇷 Zuid-Korea • 🇨🇳 China • 🇮🇳 India • 🇧🇷 Brazilië • 🇷🇺 Rusland

## 🐳 Docker Deployment

### Development
```bash
# Bouw lokaal
docker build -t mcp-time-server .
docker run -it mcp-time-server
```

### Production met Docker Compose
```bash
# Download productie configuratie
curl -O https://raw.githubusercontent.com/hasecon/mcp-astronomical-time-server/main/docker-compose.yml

# Start services
docker-compose up -d

# Bekijk logs
docker-compose logs -f mcp-time-server

# Stop services
docker-compose down
```

## 🛡️ Security & Rate Limiting

De server bevat ingebouwde bescherming tegen misbruik:

- **Rate Limiting**: 100 requests per 15 minuten, 20 per minuut
- **DDoS Protection**: Automatische IP tracking en blocking
- **Resource Limits**: Memory en CPU beperking
- **Security Headers**: Veilige HTTP headers
- **Container Security**: Non-root user, read-only filesystem

## 📊 Monitoring & Analytics

### Server Statistieken
```
"Hoe draait de server?"
→ get_server_stats

Toont:
📊 Request counts en error rates
⏰ Server uptime
🎯 Populairste tools  
🛡️ Rate limiting status
🌟 Active features
```

## 🤝 Contributing

We verwelkomen bijdragen! Zie onze [Contributing Guide](CONTRIBUTING.md) voor details.

### Development Setup
```bash
# Clone en setup
git clone https://github.com/hasecon/mcp-astronomical-time-server.git
cd mcp-astronomical-time-server
npm install

# Development mode met hot reload
npm run dev

# Run tests
npm test

# Linting en formatting
npm run lint
npm run format
```

## 📜 License

Dit project is gelicenseerd onder de [MIT License](LICENSE).

## 🙏 Acknowledgments

- **[Anthropic](https://www.anthropic.com/)** voor het Model Context Protocol
- **[Nager.Date](https://date.nager.at/)** voor internationale feestdagen data
- **[Node.js](https://nodejs.org/)** en **[TypeScript](https://www.typescriptlang.org/)** community

## 📞 Support

- 📚 [Documentation](docs/)
- 🐛 [Issues](https://github.com/hasecon/mcp-astronomical-time-server/issues)
- 💬 [Discussions](https://github.com/hasecon/mcp-astronomical-time-server/discussions)
- 📧 Email: support@hasecon.nl

---

<div align="center">

**⭐ Vind je dit project nuttig? Geef het een ster op GitHub! ⭐**

[🌟 Star on GitHub](https://github.com/hasecon/mcp-astronomical-time-server) • [🐳 Docker Hub](https://hub.docker.com/r/hasecon/mcp-astronomical-time-server) • [📦 NPM Package](https://www.npmjs.com/package/mcp-astronomical-time-server)

</div>