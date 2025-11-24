# Better Notion MCP

**A Better MCP Server for Notion - Markdown-First, Token-Efficient, Human-Centric Workflows for AI Agents**

[![GitHub stars](https://img.shields.io/github/stars/n24q02m/better-notion-mcp)](https://github.com/n24q02m/better-notion-mcp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40n24q02m%2Fbetter-notion-mcp.svg)](https://www.npmjs.com/package/@n24q02m/better-notion-mcp)
[![Docker](https://img.shields.io/docker/v/n24q02m/better-notion-mcp?label=docker)](https://hub.docker.com/r/n24q02m/better-notion-mcp)

## Overview

This MCP server provides **7 mega action-based tools** that consolidate Notion's 28+ REST API endpoints into intuitive, composite operations optimized for AI agents.

### Key Advantages

| Feature | Better Notion MCP | Standard Approach |
|---------|------------------|-------------------|
| **Content Format** | Markdown (human-readable) | Raw JSON blocks (verbose) |
| **Operations** | Composite actions (create page + content in 1 call) | Atomic endpoints (2+ calls) |
| **Pagination** | Automatic (transparent) | Manual cursor management |
| **Bulk Operations** | Native batch support | Loop through items manually |
| **Tool Count** | 7 mega tools (action-based) | 28+ individual endpoints |
| **Token Efficiency** | Optimized for AI context | Standard API responses |

### Design Principles

- **Markdown-First**: Natural language content format for AI understanding
- **Composite Actions**: Combine related operations (e.g., create page with title + content + properties in one call)
- **Auto-Pagination**: Transparent handling of large datasets without cursor management
- **Bulk Operations**: Process multiple items efficiently in single requests
- **Safe-by-Default**: Risky operations (database schema type changes) intentionally excluded

---

## Quick Start

### NPX (Recommended)

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@n24q02m/better-notion-mcp@latest"],
      "env": {
        "NOTION_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Docker

```json
{
  "mcpServers": {
    "notion": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "NOTION_TOKEN", "n24q02m/better-notion-mcp:latest"],
      "env": {
        "NOTION_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Get Notion Token

1. Visit <https://www.notion.so/my-integrations>
2. Click "New integration"
3. Name it and select your workspace
4. Copy the **Internal Integration Token**
5. Share pages/databases with your integration

---

## 7 Mega Tools (30+ Actions)

### 1. `pages` - Complete page lifecycle

**Actions**: `create`, `get`, `update`, `archive`, `restore`, `duplicate`

- **create**: Create page with title + markdown content + properties in one call
- **get**: Retrieve full page as markdown with all properties
- **update**: Update title, properties, and/or content (replace/append/prepend)
- **archive/restore**: Bulk archive or restore multiple pages
- **duplicate**: Duplicate a page with all content

### 2. `databases` - Database operations

**Actions**: `create`, `get`, `query`, `create_page`, `update_page`, `delete_page`, `create_data_source`, `update_data_source`, `update_database`

- **create**: Create database with initial data source
- **get**: Retrieve database schema and structure
- **query**: Query database with filters/sorts + smart search
- **create_page**: Create new database items (supports bulk)
- **update_page**: Update database items (supports bulk)
- **delete_page**: Delete database items (supports bulk)
- **create_data_source**: Add additional data source to database
- **update_data_source**: Update data source schema
- **update_database**: Update database container (title, icon, cover, move)

### 3. `blocks` - Granular block editing

**Actions**: `get`, `children`, `append`, `update`, `delete`

Fine-grained content manipulation at block level for precise edits within pages.

### 4. `users` - User management

**Actions**: `list`, `get`, `me`, `from_workspace`

- **list**: List all users in workspace (requires permission)
- **get**: Get specific user by ID
- **me**: Get current bot/integration info
- **from_workspace**: Extract users from accessible pages (permission bypass)

### 5. `workspace` - Workspace operations

**Actions**: `info`, `search`

- **info**: Get bot and workspace information
- **search**: Smart workspace-wide search with filters

### 6. `comments` - Comment operations

**Actions**: `list`, `create`

List and create comments on pages with threading support.

### 7. `content_convert` - Format conversion utility

**Directions**: `markdown-to-blocks`, `blocks-to-markdown`

Convert between human-readable Markdown and Notion's block format for advanced use cases.

---

## Development

### Prerequisites

- Node.js 22+
- npm 10+
- Notion Integration with appropriate permissions

### Build from Source

```bash
git clone https://github.com/n24q02m/better-notion-mcp
cd better-notion-mcp
npm install
npm run build
```

### Available Scripts

```bash
npm run dev          # Development with watch mode
npm run build        # Build for production
npm test             # Run tests
npm run test:watch   # Watch mode
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # TypeScript type checking
npm run check        # Run all checks (type-check + lint + format:check)
```

### Local Development

```bash
# Run with your Notion token
NOTION_TOKEN=secret_xxx npm run dev

# Or use environment variable
export NOTION_TOKEN=secret_xxx
npm run dev
```

### Docker Development

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following our [commit conventions](CONTRIBUTING.md#commit-convention)
4. Run checks: `npm run check`
5. Run tests: `npm test`
6. Submit a pull request

---

## License

MIT License - See [LICENSE](LICENSE)

---

**Star this repo if you find it useful! ⭐**
