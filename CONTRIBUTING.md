# Contributing to Better Notion MCP

Thank you for your interest in contributing to Better Notion MCP! This guide will help you get started.

## Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `npm install`
3. **Build the project**: `npm run build`
4. **Run tests**: `npm test`

## Development Workflow

### Running Locally

```bash
# Set your Notion token
export NOTION_TOKEN=secret_xxx

# Start development server with auto-reload
npm run dev
```

### Making Changes

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm test`
4. Build the project: `npm run build`
5. Commit your changes (see [Commit Convention](#commit-convention))
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies

### Examples

```text
feat: add bulk delete operation for pages
fix: handle pagination errors gracefully
docs: update API examples in README
test: add integration tests for databases tool
```

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Add tests for new functionality
- Ensure all tests pass
- Follow existing code style

## Code Style

- Use TypeScript strict mode
- Follow existing patterns in the codebase
- Write clear, descriptive variable names
- Add comments for complex logic
- Keep functions small and focused

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Questions?

Feel free to open an issue for:

- Bug reports
- Feature requests
- Questions about the codebase

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
