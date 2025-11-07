/**
 * Tool Registry
 * Central registration for all composite tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { Client } from '@notionhq/client'

// Import composite tools
import { commentsManage } from './composite/comments.js'
import { contentConvert } from './composite/content.js'
import { databasesCreate, databasesItems, databasesQuery, databasesSchema } from './composite/databases.js'
import { pagesCreate, pagesEdit, pagesGet, pagesManage } from './composite/pages.js'
import { searchSmart } from './composite/search.js'
import { workspaceExplore, workspaceInfo } from './composite/workspace.js'
import { NotionMCPError, aiReadableMessage } from './helpers/errors.js'

/**
 * Tool definitions with enhanced descriptions
 */
const TOOLS = [
  {
    name: 'pages_create',
    description: 'Create a new page with title and content in one operation. Supports parent pages, databases, icons, covers, and markdown content.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Page title' },
        content: { type: 'string', description: 'Page content in Markdown format (optional)' },
        parent_id: { type: 'string', description: 'Parent page or database ID (optional, creates workspace-level page if omitted)' },
        icon: { type: 'string', description: 'Emoji icon (optional)' },
        cover: { type: 'string', description: 'Cover image URL (optional)' },
        properties: { type: 'object', description: 'Database properties for pages in databases (optional)' }
      },
      required: ['title']
    }
  },
  {
    name: 'pages_edit',
    description: 'Edit existing page title, content, and properties. Can replace, append, or prepend content.',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID to edit' },
        title: { type: 'string', description: 'New title (optional)' },
        content: { type: 'string', description: 'New content in Markdown - replaces existing (optional)' },
        append_content: { type: 'string', description: 'Content to append to end in Markdown (optional)' },
        prepend_content: { type: 'string', description: 'Content to prepend to start in Markdown (optional)' },
        properties: { type: 'object', description: 'Updated properties (optional)' },
        icon: { type: 'string', description: 'New emoji icon (optional)' },
        cover: { type: 'string', description: 'New cover image URL (optional)' },
        archived: { type: 'boolean', description: 'Archive status (optional)' }
      },
      required: ['page_id']
    }
  },
  {
    name: 'pages_get',
    description: 'Get page with full content as markdown, including all properties and metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID to retrieve' }
      },
      required: ['page_id']
    }
  },
  {
    name: 'pages_manage',
    description: 'Bulk manage multiple pages: archive, restore, move, or duplicate.',
    inputSchema: {
      type: 'object',
      properties: {
        page_ids: { type: 'array', items: { type: 'string' }, description: 'Array of page IDs' },
        action: { type: 'string', enum: ['archive', 'restore', 'move', 'duplicate'], description: 'Action to perform' },
        target_parent_id: { type: 'string', description: 'Target parent for move action (optional)' }
      },
      required: ['page_ids', 'action']
    }
  },
  {
    name: 'databases_query',
    description: 'Query database with smart filtering, search, and sorting. Automatically searches across all text properties.',
    inputSchema: {
      type: 'object',
      properties: {
        database_id: { type: 'string', description: 'Database ID to query' },
        filters: { type: 'object', description: 'Notion filter object (optional)' },
        sorts: { type: 'array', description: 'Sort configuration (optional)' },
        limit: { type: 'number', description: 'Max results to return (optional)' },
        search: { type: 'string', description: 'Smart search across all text properties (optional)' }
      },
      required: ['database_id']
    }
  },
  {
    name: 'databases_items',
    description: 'Bulk create, update, or delete database items in one operation.',
    inputSchema: {
      type: 'object',
      properties: {
        database_id: { type: 'string', description: 'Database ID' },
        action: { type: 'string', enum: ['create', 'update', 'delete'], description: 'Action to perform' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page_id: { type: 'string', description: 'Page ID (required for update/delete)' },
              properties: { type: 'object', description: 'Item properties' }
            }
          },
          description: 'Array of items to process'
        }
      },
      required: ['database_id', 'action', 'items']
    }
  },
  {
    name: 'databases_schema',
    description: 'Get database schema and structure information.',
    inputSchema: {
      type: 'object',
      properties: {
        database_id: { type: 'string', description: 'Database ID' }
      },
      required: ['database_id']
    }
  },
  {
    name: 'databases_create',
    description: 'Create a new database with specified properties and schema.',
    inputSchema: {
      type: 'object',
      properties: {
        parent_id: { type: 'string', description: 'Parent page ID' },
        title: { type: 'string', description: 'Database title' },
        description: { type: 'string', description: 'Database description (optional)' },
        properties: { type: 'object', description: 'Property schema definition' },
        is_inline: { type: 'boolean', description: 'Display as inline database (optional)' }
      },
      required: ['parent_id', 'title', 'properties']
    }
  },
  {
    name: 'search_smart',
    description: 'Smart search across workspace with context-aware ranking and filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        filter: {
          type: 'object',
          properties: {
            object: { type: 'string', enum: ['page', 'database'], description: 'Filter by object type' },
            property: { type: 'string', description: 'Property to filter' },
            value: { description: 'Filter value' }
          },
          description: 'Search filters (optional)'
        },
        sort: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['ascending', 'descending'] },
            timestamp: { type: 'string', enum: ['last_edited_time', 'created_time'] }
          },
          description: 'Sort configuration (optional)'
        },
        limit: { type: 'number', description: 'Max results (optional)' }
      },
      required: ['query']
    }
  },
  {
    name: 'comments_manage',
    description: 'Manage page comments: list, create, or resolve.',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'Page ID (required for list/create)' },
        discussion_id: { type: 'string', description: 'Discussion ID (optional)' },
        action: { type: 'string', enum: ['list', 'create', 'resolve'], description: 'Action to perform' },
        content: { type: 'string', description: 'Comment content (required for create)' }
      },
      required: ['action']
    }
  },
  {
    name: 'workspace_explore',
    description: 'Explore workspace content: recent, shared, or all items.',
    inputSchema: {
      type: 'object',
      properties: {
        view: { type: 'string', enum: ['recent', 'shared', 'all'], description: 'View type' },
        filter: {
          type: 'object',
          properties: {
            object: { type: 'string', enum: ['page', 'database'] }
          },
          description: 'Filter options (optional)'
        },
        limit: { type: 'number', description: 'Max results (optional)' }
      },
      required: ['view']
    }
  },
  {
    name: 'workspace_info',
    description: 'Get workspace and bot information.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'content_convert',
    description: 'Convert between Markdown and Notion blocks format.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['markdown-to-blocks', 'blocks-to-markdown'],
          description: 'Conversion direction'
        },
        content: { description: 'Content to convert (string for markdown, array for blocks)' }
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

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS
  }))

  // Call tool handler
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
        // Pages
        case 'pages_create':
          result = await pagesCreate(notion, args as any)
          break
        case 'pages_edit':
          result = await pagesEdit(notion, args as any)
          break
        case 'pages_get':
          result = await pagesGet(notion, args.page_id as string)
          break
        case 'pages_manage':
          result = await pagesManage(notion, args as any)
          break

        // Databases
        case 'databases_query':
          result = await databasesQuery(notion, args as any)
          break
        case 'databases_items':
          result = await databasesItems(notion, args as any)
          break
        case 'databases_schema':
          result = await databasesSchema(notion, args.database_id as string)
          break
        case 'databases_create':
          result = await databasesCreate(notion, args as any)
          break

        // Search
        case 'search_smart':
          result = await searchSmart(notion, args as any)
          break

        // Comments
        case 'comments_manage':
          result = await commentsManage(notion, args as any)
          break

        // Workspace
        case 'workspace_explore':
          result = await workspaceExplore(notion, args as any)
          break
        case 'workspace_info':
          result = await workspaceInfo(notion)
          break

        // Content
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
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
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
        content: [
          {
            type: 'text',
            text: aiReadableMessage(enhancedError)
          }
        ],
        isError: true
      }
    }
  })
}
