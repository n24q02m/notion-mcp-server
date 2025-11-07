/**
 * Tool Registry - 8 Mega Tools
 * Consolidated registration for maximum coverage with minimal tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { Client } from '@notionhq/client'

// Import mega tools
import { blocks } from './composite/blocks.js'
import { commentsManage } from './composite/comments.js'
import { contentConvert } from './composite/content.js'
import { databases } from './composite/databases.js'
import { pages } from './composite/pages.js'
import { users } from './composite/users.js'
import { workspace } from './composite/workspace.js'
import { NotionMCPError, aiReadableMessage } from './helpers/errors.js'

/**
 * 8 Mega Tools covering 75% of Official Notion API
 */
const TOOLS = [
  {
    name: 'pages',
    description: `All page operations in one tool. Actions: create, get, update, archive, restore, duplicate.

Maps to: POST/GET/PATCH /v1/pages + GET/PATCH /v1/blocks/{id}/children

Examples:
- Create: {action: "create", title: "My Page", parent_id: "xxx", content: "# Hello\\nMarkdown content"}
- Get: {action: "get", page_id: "xxx"}
- Update: {action: "update", page_id: "xxx", title: "New Title", append_content: "\\n## New section"}
- Archive: {action: "archive", page_id: "xxx"}
- Duplicate: {action: "duplicate", page_id: "xxx"}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'get', 'update', 'archive', 'restore', 'duplicate'],
          description: 'Action to perform'
        },
        page_id: { type: 'string', description: 'Page ID (required for most actions)' },
        page_ids: { type: 'array', items: { type: 'string' }, description: 'Multiple page IDs for batch operations' },
        title: { type: 'string', description: 'Page title' },
        content: { type: 'string', description: 'Markdown content' },
        append_content: { type: 'string', description: 'Markdown to append' },
        prepend_content: { type: 'string', description: 'Markdown to prepend' },
        parent_id: { type: 'string', description: 'Parent page or database ID' },
        properties: { type: 'object', description: 'Page properties (for database pages)' },
        icon: { type: 'string', description: 'Emoji icon' },
        cover: { type: 'string', description: 'Cover image URL' },
        archived: { type: 'boolean', description: 'Archive status' }
      },
      required: ['action']
    }
  },
  {
    name: 'databases',
    description: `All database operations in one tool. Actions: create, get, query, create_page, update_page, delete_page.

Maps to: POST/GET /v1/databases + POST /v1/databases/{id}/query + POST/PATCH /v1/pages

Examples:
- Create DB: {action: "create", parent_id: "xxx", title: "Tasks", properties: {Status: {select: {options: [{name: "Todo"}, {name: "Done"}]}}}}
- Get schema: {action: "get", database_id: "xxx"}
- Query: {action: "query", database_id: "xxx", filters: {property: "Status", select: {equals: "Done"}}}
- Smart search: {action: "query", database_id: "xxx", search: "project"}
- Create items: {action: "create_page", database_id: "xxx", pages: [{properties: {Name: "Item 1", Status: "Todo"}}]}
- Update items: {action: "update_page", database_id: "xxx", pages: [{page_id: "yyy", properties: {Status: "Done"}}]}
- Delete items: {action: "delete_page", database_id: "xxx", page_ids: ["yyy", "zzz"]}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'get', 'query', 'create_page', 'update_page', 'delete_page'],
          description: 'Action to perform'
        },
        database_id: { type: 'string', description: 'Database ID' },
        parent_id: { type: 'string', description: 'Parent page ID (for create)' },
        title: { type: 'string', description: 'Database title' },
        description: { type: 'string', description: 'Database description' },
        properties: { type: 'object', description: 'Database schema properties' },
        is_inline: { type: 'boolean', description: 'Display as inline' },
        filters: { type: 'object', description: 'Query filters' },
        sorts: { type: 'array', description: 'Query sorts' },
        limit: { type: 'number', description: 'Max results' },
        search: { type: 'string', description: 'Smart search across text fields' },
        page_id: { type: 'string', description: 'Single page ID' },
        page_ids: { type: 'array', items: { type: 'string' }, description: 'Multiple page IDs' },
        page_properties: { type: 'object', description: 'Page properties' },
        pages: { type: 'array', description: 'Array of pages for bulk operations' }
      },
      required: ['action']
    }
  },
  {
    name: 'blocks',
    description: `All block operations in one tool. Actions: get, children, append, update, delete.

Maps to: GET/PATCH/DELETE /v1/blocks/{id} + GET/PATCH /v1/blocks/{id}/children

Examples:
- Get block: {action: "get", block_id: "xxx"}
- Get children: {action: "children", block_id: "xxx"}
- Append: {action: "append", block_id: "xxx", content: "## New section\\nContent here"}
- Update: {action: "update", block_id: "xxx", content: "Updated text"}
- Delete: {action: "delete", block_id: "xxx"}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'children', 'append', 'update', 'delete'],
          description: 'Action to perform'
        },
        block_id: { type: 'string', description: 'Block ID' },
        content: { type: 'string', description: 'Markdown content (for append/update)' }
      },
      required: ['action', 'block_id']
    }
  },
  {
    name: 'users',
    description: `All user operations in one tool. Actions: list, get, me.

Maps to: GET /v1/users + GET /v1/users/{id} + GET /v1/users/me

Examples:
- List all: {action: "list"}
- Get user: {action: "get", user_id: "xxx"}
- Get bot info: {action: "me"}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'me'],
          description: 'Action to perform'
        },
        user_id: { type: 'string', description: 'User ID (for get action)' }
      },
      required: ['action']
    }
  },
  {
    name: 'workspace',
    description: `Workspace operations. Actions: info, search.

Maps to: GET /v1/users/me + POST /v1/search

Examples:
- Get info: {action: "info"}
- Search: {action: "search", query: "project", filter: {object: "page"}, limit: 10}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['info', 'search'],
          description: 'Action to perform'
        },
        query: { type: 'string', description: 'Search query' },
        filter: {
          type: 'object',
          properties: {
            object: { type: 'string', enum: ['page', 'database'] }
          }
        },
        sort: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['ascending', 'descending'] },
            timestamp: { type: 'string', enum: ['last_edited_time', 'created_time'] }
          }
        },
        limit: { type: 'number', description: 'Max results' }
      },
      required: ['action']
    }
  },
  {
    name: 'comments',
    description: `Comment operations. Actions: list, create.

Maps to: GET /v1/comments + POST /v1/comments

Examples:
- List: {action: "list", page_id: "xxx"}
- Create: {action: "create", page_id: "xxx", content: "Great work!"}
- Reply: {action: "create", discussion_id: "xxx", content: "I agree"}`,
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID' },
        discussion_id: { type: 'string', description: 'Discussion ID (for replies)' },
        action: { type: 'string', enum: ['list', 'create'], description: 'Action to perform' },
        content: { type: 'string', description: 'Comment content (for create)' }
      },
      required: ['action']
    }
  },
  {
    name: 'content_convert',
    description: `Utility: Convert between Markdown and Notion blocks format.

Examples:
- To blocks: {direction: "markdown-to-blocks", content: "# Hello\\nWorld"}
- To markdown: {direction: "blocks-to-markdown", content: [{type: "paragraph", ...}]}`,
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['markdown-to-blocks', 'blocks-to-markdown'],
          description: 'Conversion direction'
        },
        content: { description: 'Content to convert (string or array/JSON string)' }
      },
      required: ['direction', 'content']
    }
  }
]

/**
 * Register all tools with MCP server
 */
export function registerTools(server: Server, notionToken: string) {
  const notion = new Client({ auth: notionToken })

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    if (!args) {
      return {
        content: [{
          type: 'text',
          text: 'Error: No arguments provided'
        }],
        isError: true
      }
    }

    try {
      let result

      switch (name) {
        case 'pages':
          result = await pages(notion, args as any)
          break
        case 'databases':
          result = await databases(notion, args as any)
          break
        case 'blocks':
          result = await blocks(notion, args as any)
          break
        case 'users':
          result = await users(notion, args as any)
          break
        case 'workspace':
          result = await workspace(notion, args as any)
          break
        case 'comments':
          result = await commentsManage(notion, args as any)
          break
        case 'content_convert':
          result = await contentConvert(args as any)
          break
        default:
          throw new NotionMCPError(
            `Unknown tool: ${name}`,
            'UNKNOWN_TOOL',
            `Available tools: ${TOOLS.map(t => t.name).join(', ')}`
          )
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    } catch (error) {
      const enhancedError = error instanceof NotionMCPError
        ? error
        : new NotionMCPError(
          (error as Error).message,
          'TOOL_ERROR',
          'Check the error details and try again'
        )

      return {
        content: [{
          type: 'text',
          text: aiReadableMessage(enhancedError)
        }],
        isError: true
      }
    }
  })
}
