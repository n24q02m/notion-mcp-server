# Notion MCP Enhanced

**Composite MCP Server for Notion - Human-Like Workflows for AI Agents**

[![npm version](https://badge.fury.io/js/%40n24q02m%2Fnotion-mcp-enhanced.svg)](https://www.npmjs.com/package/@n24q02m/notion-mcp-enhanced)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org)

## 🎯 Design Philosophy

This MCP server enables **AI agents to work with Notion using human-like workflows**:

1. **Composite Operations**: Complete tasks in single tool calls (e.g., create page with title + content + properties)
2. **Markdown-First**: Natural language content format optimized for AI understanding
3. **Auto-Pagination**: Transparent handling of large datasets
4. **Bulk Operations**: Process multiple items efficiently in one request

## ✨ Key Features

- **13 Composite Tools**: Each tool completes a full workflow (pages, databases, workspace)
- **Markdown Support**: Write and read Notion content in markdown format
- **Auto-Pagination**: Automatically fetch all results without cursor management
- **Bulk Operations**: Create/update/delete multiple items in single requests
- **Simple Deployment**: npx one-liner or Docker container

## 🚀 Quick Start

### NPX (No Installation Required)

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["@n24q02m/notion-mcp-enhanced"],
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
        "n24q02m/notion-mcp:latest"
      ]
    }
  }
}
```

### NPM Global

```bash
npm install -g @n24q02m/notion-mcp-enhanced
```

```json
{
  "mcpServers": {
    "notion": {
      "command": "notion-mcp",
      "env": {
        "NOTION_TOKEN": "your-notion-token-here"
      }
    }
  }
}
```

## 🔑 Get Notion Token

1. Visit <https://www.notion.so/my-integrations>
2. Click "New integration"
3. Name it and select your workspace
4. Copy the **Internal Integration Token**
5. Share pages/databases with your integration

## 💡 Usage Examples

### Create Page with Content

```javascript
pages_create({
  title: "Meeting Notes - Q4 Planning",
  content: `# Agenda

- Budget review
- Roadmap discussion

## Action Items

- [ ] Update projections
- [ ] Schedule follow-up`,
  icon: "📝",
  parent_id: "database_id"
})
```

Complete page creation in one call - title, content, and properties.

### Bulk Database Updates

```javascript
databases_items({
  database_id: "tasks_db",
  action: "update",
  items: [
    { page_id: "1", properties: { Status: "Done" } },
    { page_id: "2", properties: { Status: "In Progress" } },
    { page_id: "3", properties: { Status: "Todo" } }
  ]
})
```

Update multiple database items in a single operation.

## 🛠️ 13 Composite Tools

Each tool is designed as a complete human workflow, not an atomic API operation.

### Pages (4 tools)

1. **`pages_create`** - Create page with content in one call
   - Combines: create page + append blocks + set properties
   - Input: title, markdown content, parent, icon, cover, properties
   - Saves: 2-3 tool calls per page

2. **`pages_edit`** - Update page with flexible content operations
   - Supports: replace all content, append to end, prepend to start
   - Combines: update properties + manage blocks
   - Saves: 1-2 tool calls per edit

3. **`pages_get`** - Retrieve full page as markdown
   - Combines: get page + list all blocks + convert to markdown
   - Auto-pagination for large pages
   - Saves: 2+ tool calls for large pages

4. **`pages_manage`** - Bulk page operations
   - Actions: archive, restore, duplicate multiple pages
   - Single call for batch operations
   - Saves: N-1 calls for N pages

### Databases (4 tools)

5. **`databases_query`** - Smart query with auto-pagination
   - Built-in smart search across all text properties
   - Auto-pagination for unlimited results
   - Returns formatted, AI-readable data

6. **`databases_items`** - Bulk create/update/delete
   - Process multiple items in one call
   - Saves: N-1 calls for N items

7. **`databases_schema`** - Get database structure
   - Returns AI-friendly schema description
   - Includes property types, options, formulas

8. **`databases_create`** - Create database with schema
   - Define all properties in one call

### Workspace (5 tools)

9. **`search_smart`** - Context-aware workspace search
   - Intelligent ranking and filtering
   - Auto-pagination

10. **`comments_manage`** - List and create comments
    - Unified interface for all comment operations

11. **`workspace_explore`** - Navigate recent/shared content
    - Quick access to workspace overview

12. **`workspace_info`** - Bot and workspace information

13. **`content_convert`** - Markdown ↔ Notion blocks
    - Bidirectional conversion utility

## 🎨 Real-World Use Cases

### Automated Meeting Notes

```javascript
pages_create({
  title: "Team Sync - Dec 1",
  content: `# Agenda
- Sprint review
- Next sprint planning

## Attendees
- Alice, Bob, Carol

## Notes
(To be filled)`,
  parent_id: "meetings_db",
  properties: {
    "Date": "2024-12-01",
    "Type": "Team Sync"
  }
})
```

Create complete meeting notes page with agenda, structure, and properties in one call.

### Bulk Task Import

```javascript
databases_items({
  database_id: "tasks_db",
  action: "create",
  items: csvData.map(row => ({
    properties: {
      "Task": row.name,
      "Priority": row.priority,
      "Assignee": row.assignee,
      "Due Date": row.due
    }
  }))
})
```

Import multiple tasks from external data sources efficiently.

### Smart Workspace Search

```javascript
search_smart({
  query: "Q4 roadmap",
  filter: { object: "page" },
  sort: {
    direction: "descending",
    timestamp: "last_edited_time"
  }
})
```

Search across workspace with automatic pagination for all results.

## 🔧 Development

### Prerequisites

- Node.js 22+ (uses native fetch)
- npm 7+
- Notion Integration with appropriate permissions

### Build from Source

```bash
git clone https://github.com/n24q02m/notion-mcp-server
cd notion-mcp-server
npm install
npm run build
```

### Local Development

```bash
# Run with your Notion token
NOTION_API_KEY=secret_xxx npm run start

# Or use environment variable
export NOTION_API_KEY=secret_xxx
npm run start
```

### Docker Development

```bash
# Build image
docker build -t notion-mcp-enhanced .

# Run container
docker run -e NOTION_API_KEY=secret_xxx notion-mcp-enhanced
```

### Architecture

```
notion-mcp-enhanced/
├── src/
│   ├── init-server.ts          # MCP server initialization
│   └── tools/
│       ├── registry.ts         # Central tool registration
│       ├── composite/          # 13 composite tools (6 files)
│       │   ├── pages.ts        # 4 page tools
│       │   ├── databases.ts    # 4 database tools
│       │   └── workspace.ts    # 5 workspace tools
│       └── helpers/            # Shared utilities
│           ├── markdown.ts     # Markdown ↔ Blocks conversion
│           ├── pagination.ts   # Auto-pagination wrapper
│           ├── richtext.ts     # Rich text formatting
│           └── errors.ts       # AI-friendly error messages
├── scripts/
│   ├── start-server.ts         # Entry point
│   └── build-cli.js            # CLI build config
└── tests/
    └── test-composite-tools.js # Tool verification
```

### Testing

```bash
# Verify all 13 tools registered correctly
npm test

# Manual testing with Claude Desktop
# Add to ~/.config/Claude/claude_desktop_config.json:
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@n24q02m/notion-mcp-enhanced"],
      "env": {
        "NOTION_API_KEY": "secret_xxx"
      }
    }
  }
}
```

## 📝 Changelog

### v1.0.0 - Initial Release

**Features:**
- ✨ 13 composite tools for pages, databases, and workspace operations
- 📝 Built-in Markdown ↔ Notion blocks conversion
- 🔄 Automatic pagination for unlimited results
- 🚀 Simple deployment via npx or Docker
- ⚡ Node.js 22+ with native fetch support

## 🤝 Contributing

Contributions welcome!

**Priority Areas:**
- **New Composite Tools**: Identify common workflows that could be simplified
- **Markdown Features**: Improve conversion accuracy (tables, callouts, databases, etc.)
- **Error Handling**: Enhance error messages for better AI understanding
- **Documentation**: Examples, use cases, and guides

**Contribution Process:**
1. Fork repository
2. Create feature branch (`git checkout -b feature/new-tool`)
3. Test with real Notion workspace
4. Add tests for new functionality
5. Submit PR with clear description

## 📄 License

MIT License - See [LICENSE](LICENSE)

## 🙏 Acknowledgments

- **Built With**:
  - [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP framework
  - [@notionhq/client](https://github.com/makenotion/notion-sdk-js) - Official Notion SDK

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/@n24q02m/notion-mcp-enhanced)
- [GitHub Repository](https://github.com/n24q02m/notion-mcp-server)
- [Notion API Documentation](https://developers.notion.com)
- [Model Context Protocol](https://modelcontextprotocol.io)

---

**Composite MCP Server - Human Workflows for AI Agents**
