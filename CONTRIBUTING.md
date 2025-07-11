# Contributing to MCP Astronomical Time Server

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/mcp-astronomical-time-server.git
cd mcp-astronomical-time-server

# Install dependencies
npm install

# Build the project
npm run build

# Start development mode
npm run dev

# Run linting
npm run lint

# Format code
npm run format
```

### Docker Development

```bash
# Build and test container
docker build -t mcp-time-server .
docker run -it mcp-time-server

# Or use Docker Compose
docker-compose up --build
```

## Code Style

We use:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

### Commit Messages

Please use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add new moon phase calculation
fix: correct timezone conversion for DST
docs: update API documentation
```

## Feature Requests

We use GitHub issues to track public bugs and feature requests. Please use our issue templates:

### Bug Reports

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Feature Requests

**Great Feature Requests** include:

- Clear description of the feature
- Why this feature would be useful
- Example usage or API design
- Implementation ideas (optional)

## Testing

Please write tests for new features:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments for new functions
- Update API documentation for new tools

## Areas for Contribution

We're especially looking for help with:

### 🌟 New Features
- Additional astronomical calculations
- More international holiday sources  
- Advanced productivity tools
- Additional timezone utilities

### 🐛 Bug Fixes
- Astronomical calculation accuracy
- Rate limiting edge cases
- Memory leak prevention
- Error handling improvements

### 📚 Documentation
- API documentation
- Usage examples
- Tutorial videos
- Deployment guides

### 🧪 Testing
- Unit test coverage
- Integration tests
- Performance benchmarks
- Security testing

### 🌍 Internationalization
- More language support
- Regional calendar systems
- Cultural holiday additions

## Code Review Process

1. All code changes require review
2. Maintainers will review PRs within 48-72 hours
3. Reviews focus on:
   - Code quality and style
   - Test coverage
   - Documentation
   - Security implications
   - Performance impact

## Security

- Report security vulnerabilities privately to support@hasecon.nl
- Do not open public issues for security concerns
- We'll acknowledge within 24 hours and provide updates

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes
- Documentation credits

## Questions?

- 💬 [GitHub Discussions](https://github.com/hasecon/mcp-astronomical-time-server/discussions)
- 🐛 [Issues](https://github.com/hasecon/mcp-astronomical-time-server/issues)
- 📧 Email: support@hasecon.nl

## Code of Conduct

### Our Pledge

We pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to a positive environment:
- Being respectful of differing viewpoints and experiences
- Giving and gracefully accepting constructive feedback
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:
- The use of sexualized language or imagery
- Trolling, insulting or derogatory comments
- Public or private harassment
- Publishing others' private information without permission

## Getting Started

Ready to contribute? Here's how to set up for local development:

1. **Join the Discussion**: Check our [GitHub Discussions](https://github.com/hasecon/mcp-astronomical-time-server/discussions)
2. **Pick an Issue**: Look for "good first issue" labels
3. **Fork & Clone**: Get your development environment ready
4. **Code**: Make your changes
5. **Test**: Ensure everything works
6. **Submit**: Create a pull request

Thank you for contributing! 🌟