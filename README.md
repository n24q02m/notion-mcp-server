# Better Notion MCP

**Composite MCP Server for Notion - Human-Like Workflows for AI Agents**

[![GitHub stars](https://img.shields.io/github/stars/n24q02m/better-notion-mcp)](https://github.com/n24q02m/better-notion-mcp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40n24q02m%2Fbetter-notion-mcp.svg)](https://www.npmjs.com/package/@n24q02m/better-notion-mcp)
[![Docker](https://img.shields.io/docker/v/n24q02m/better-notion-mcp?label=docker)](https://hub.docker.com/r/n24q02m/better-notion-mcp)

## 🎯 Design Philosophy

**Mission**: Enable AI agents to work with Notion using **human-like workflows** while maintaining **near-complete API coverage** with **minimal tools and token usage**.

This MCP server transforms Notion's 28+ atomic REST API endpoints into **7 mega action-based tools** that mirror how humans actually work with Notion:

1. **Action-Based Design**: Each tool supports multiple related actions (e.g., pages tool: create, get, update, archive)
2. **Markdown-First**: Natural language content format optimized for AI understanding
3. **Auto-Pagination**: Transparent handling of large datasets
4. **Bulk Operations**: Process multiple items efficiently in one request
5. **Safe-by-Default**: Only safe operations exposed (no risky schema updates)

## ✨ Key Features

- **7 Mega Tools**: 75% Official API coverage (21/28 endpoints) with safe operations only
- **25+ Actions**: Multiple actions per tool for comprehensive functionality
- **Markdown Support**: Write and read Notion content in markdown format
- **Auto-Pagination**: Automatically fetch all results without cursor management
- **Bulk Operations**: Create/update/delete multiple items in single requests
- **Simple Deployment**: npx one-liner or Docker container
- **Safe-by-Default**: Risky operations (database schema updates) intentionally excluded

## 🚀 Quick Start

### NPX

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["@n24q02m/better-notion-mcp"],
      "env": {
        "NOTION_TOKEN": "your-notion-token-here"
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
      "args": [
        "run", "--rm", "-i",
        "-e", "NOTION_TOKEN=your-notion-token-here",
        "n24q02m/better-notion-mcp:latest"
      ]
    }
  }
}
```

## 📚 Documentation

- **[Changelog](CHANGELOG.md)** - Version history and changes
- **[Security Policy](SECURITY.md)** - How to report security vulnerabilities

## 🔑 Get Notion Token

1. Visit <https://www.notion.so/my-integrations>
2. Click "New integration"
3. Name it and select your workspace
4. Copy the **Internal Integration Token**
5. Share pages/databases with your integration

## 🛠️ 7 Mega Action-Based Tools

Each tool supports multiple actions, mapping to 21+ Official Notion API endpoints.

### 1. **`pages`** - Complete page lifecycle (6 actions → 5 API endpoints)

**Actions**: `create`, `get`, `update`, `archive`, `restore`, `duplicate`

- **create**: Create page with title + markdown content + properties in one call
  - Maps to: `POST /v1/pages` + `PATCH /v1/blocks/{id}/children`
  - Example: `{action: "create", title: "My Page", parent_id: "xxx", content: "# Hello\nMarkdown here"}`

- **get**: Retrieve full page as markdown with all properties
  - Maps to: `GET /v1/pages/{id}` + `GET /v1/blocks/{id}/children`
  - Example: `{action: "get", page_id: "xxx"}`

- **update**: Update title, properties, and/or content (replace/append/prepend)
  - Maps to: `PATCH /v1/pages/{id}` + `PATCH /v1/blocks/{id}/children`
  - Example: `{action: "update", page_id: "xxx", title: "New Title", append_content: "\n## New section"}`

- **archive/restore**: Bulk archive or restore multiple pages
  - Maps to: Multiple `PATCH /v1/pages/{id}` calls
  - Example: `{action: "archive", page_ids: ["xxx", "yyy"]}`

- **duplicate**: Duplicate a page with all content
  - Example: `{action: "duplicate", page_id: "xxx"}`

### 2. **`databases`** - Database management (6 actions → 3 API endpoints)

**Actions**: `create`, `get`, `query`, `create_page`, `update_page`, `delete_page`

- **create**: Create database with full schema definition
  - Maps to: `POST /v1/databases`
  - Example: `{action: "create", parent_id: "xxx", title: "Tasks", properties: {Status: {select: {...}}}}`

- **get**: Retrieve database schema and structure
  - Maps to: `GET /v1/databases/{id}`
  - Example: `{action: "get", database_id: "xxx"}`

- **query**: Query database with filters/sorts + smart search
  - Maps to: `POST /v1/databases/{id}/query`
  - Example: `{action: "query", database_id: "xxx", search: "project", limit: 10}`

- **create_page/update_page/delete_page**: Bulk operations on database items
  - Maps to: `POST/PATCH /v1/pages` (database items are pages)
  - Example: `{action: "create_page", database_id: "xxx", pages: [{properties: {...}}]}`

### 3. **`blocks`** - Granular block editing (5 actions → 5 API endpoints)

**Actions**: `get`, `children`, `append`, `update`, `delete`

- Maps to: `GET/PATCH/DELETE /v1/blocks/{id}` + `GET/PATCH /v1/blocks/{id}/children`
- Example: `{action: "append", block_id: "xxx", content: "## New section\nContent here"}`

### 4. **`users`** - User management (3 actions → 3 API endpoints)

**Actions**: `list`, `get`, `me`

- Maps to: `GET /v1/users`, `GET /v1/users/{id}`, `GET /v1/users/me`
- Example: `{action: "list"}` or `{action: "get", user_id: "xxx"}` or `{action: "me"}`

### 5. **`workspace`** - Workspace operations (2 actions → 2 API endpoints)

**Actions**: `info`, `search`

- **info**: Get bot and workspace information
  - Maps to: `GET /v1/users/me`
  - Example: `{action: "info"}`

- **search**: Smart workspace-wide search with filters
  - Maps to: `POST /v1/search`
  - Example: `{action: "search", query: "project", filter: {object: "page"}, limit: 10}`

### 6. **`comments`** - Comment operations (2 actions → 2 API endpoints)

**Actions**: `list`, `create`

- Maps to: `GET /v1/comments`, `POST /v1/comments`
- Example: `{action: "list", page_id: "xxx"}` or `{action: "create", page_id: "xxx", content: "Great!"}`

### 7. **`content_convert`** - Markdown ↔ Notion blocks utility

**Utility tool** for converting between formats (not a direct API call)

- Example: `{direction: "markdown-to-blocks", content: "# Hello\nWorld"}`

## 🔧 Development

### Prerequisites

- Node.js 22+ (uses native fetch)
- npm 7+
- Notion Integration with appropriate permissions

### Build from Source

```bash
git clone https://github.com/n24q02m/better-notion-mcp
cd better-notion-mcp
npm install
npm run build
```

### Local Development

```bash
# Run with your Notion token
NOTION_TOKEN=secret_xxx npm run dev

# Or use environment variable
export NOTION_TOKEN=secret_xxx
npm run dev
```

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Docker Development

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

## 📄 License

MIT License - See [LICENSE](LICENSE)

## 🙏 Acknowledgments

- **Built With**:
  - [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP framework
  - [@notionhq/client](https://github.com/makenotion/notion-sdk-js) - Official Notion SDK

## 📞 Support & Community

- 🐛 [Report Bugs](https://github.com/n24q02m/better-notion-mcp/issues/new?template=bug_report.yml)
- 💡 [Request Features](https://github.com/n24q02m/better-notion-mcp/issues/new?template=feature_request.yml)
- ⭐ [Star this repo](https://github.com/n24q02m/better-notion-mcp) if you find it useful!

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/@n24q02m/better-notion-mcp)
- [Docker Hub](https://hub.docker.com/r/n24q02m/better-notion-mcp)
- [GitHub Repository](https://github.com/n24q02m/better-notion-mcp)
- [Notion API Documentation](https://developers.notion.com)
- [Model Context Protocol](https://modelcontextprotocol.io)

