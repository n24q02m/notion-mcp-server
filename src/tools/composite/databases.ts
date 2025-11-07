/**
 * Databases Mega Tool
 * All database operations in one unified interface
 */

import { Client } from '@notionhq/client'
import { NotionMCPError, withErrorHandling } from '../helpers/errors.js'
import { autoPaginate } from '../helpers/pagination.js'
import { convertToNotionProperties } from '../helpers/properties.js'
import * as RichText from '../helpers/richtext.js'

export interface DatabasesInput {
  action: 'create' | 'get' | 'query' | 'create_page' | 'update_page' | 'delete_page'

  // Common params
  database_id?: string

  // Create database params
  parent_id?: string
  title?: string
  description?: string
  properties?: Record<string, any>
  is_inline?: boolean

  // Query params
  filters?: any
  sorts?: any[]
  limit?: number
  search?: string

  // Page operations params (create/update/delete database items)
  page_id?: string
  page_ids?: string[]
  page_properties?: Record<string, any>

  // Bulk operations
  pages?: Array<{
    page_id?: string
    properties: Record<string, any>
  }>
}

/**
 * Unified databases tool - handles all database operations
 */
export async function databases(
  notion: Client,
  input: DatabasesInput
): Promise<any> {
  return withErrorHandling(async () => {
    switch (input.action) {
      case 'create':
        return await createDatabase(notion, input)

      case 'get':
        return await getDatabase(notion, input)

      case 'query':
        return await queryDatabase(notion, input)

      case 'create_page':
        return await createDatabasePages(notion, input)

      case 'update_page':
        return await updateDatabasePages(notion, input)

      case 'delete_page':
        return await deleteDatabasePages(notion, input)

      default:
        throw new NotionMCPError(
          `Unknown action: ${input.action}`,
          'VALIDATION_ERROR',
          'Supported actions: create, get, query, create_page, update_page, delete_page'
        )
    }
  })()
}

/**
 * Create database with schema
 * Maps to: POST /v1/databases
 */
async function createDatabase(notion: Client, input: DatabasesInput): Promise<any> {
  if (!input.parent_id || !input.title || !input.properties) {
    throw new NotionMCPError(
      'parent_id, title, and properties required for create action',
      'VALIDATION_ERROR',
      'Provide parent_id, title, and properties'
    )
  }

  const dbData: any = {
    parent: { type: 'page_id', page_id: input.parent_id },
    title: [RichText.text(input.title)],
    properties: input.properties
  }

  if (input.description) {
    dbData.description = [RichText.text(input.description)]
  }

  if (input.is_inline !== undefined) {
    dbData.is_inline = input.is_inline
  }

  const database = await notion.databases.create(dbData)

  return {
    action: 'create',
    database_id: database.id,
    url: (database as any).url,
    created: true
  }
}

/**
 * Get database schema and info
 * Maps to: GET /v1/databases/{id}
 */
async function getDatabase(notion: Client, input: DatabasesInput): Promise<any> {
  if (!input.database_id) {
    throw new NotionMCPError('database_id required for get action', 'VALIDATION_ERROR', 'Provide database_id')
  }

  const database: any = await notion.databases.retrieve({
    database_id: input.database_id
  })

  // Format properties for AI-friendly output
  const schema: any = {}
  if (database.properties) {
    for (const [name, prop] of Object.entries(database.properties)) {
      const p = prop as any
      schema[name] = {
        type: p.type,
        id: p.id
      }

      if (p.type === 'select' && p.select?.options) {
        schema[name].options = p.select.options.map((o: any) => o.name)
      } else if (p.type === 'multi_select' && p.multi_select?.options) {
        schema[name].options = p.multi_select.options.map((o: any) => o.name)
      } else if (p.type === 'formula' && p.formula) {
        schema[name].expression = p.formula.expression
      }
    }
  }

  return {
    action: 'get',
    database_id: database.id,
    title: database.title?.[0]?.plain_text || 'Untitled',
    description: database.description?.[0]?.plain_text || '',
    url: database.url,
    is_inline: database.is_inline,
    created_time: database.created_time,
    last_edited_time: database.last_edited_time,
    schema
  }
}

/**
 * Query database with filters, sorts, search
 * Maps to: POST /v1/databases/{id}/query
 */
async function queryDatabase(notion: Client, input: DatabasesInput): Promise<any> {
  if (!input.database_id) {
    throw new NotionMCPError('database_id required for query action', 'VALIDATION_ERROR', 'Provide database_id')
  }

  let filter = input.filters

  // Smart search across text properties
  if (input.search && !filter) {
    const database = await notion.databases.retrieve({
      database_id: input.database_id
    })

    const textProps = Object.entries((database as any).properties)
      .filter(([_, prop]: [string, any]) =>
        ['title', 'rich_text'].includes(prop.type)
      )
      .map(([name]) => name)

    if (textProps.length > 0) {
      filter = {
        or: textProps.map(propName => ({
          property: propName,
          rich_text: { contains: input.search }
        }))
      }
    }
  }

  const queryParams: any = { database_id: input.database_id }
  if (filter) queryParams.filter = filter
  if (input.sorts) queryParams.sorts = input.sorts

  // Fetch with pagination
  const allResults = await autoPaginate(
    async (cursor) => {
      const response: any = await (notion.databases as any).query({
        ...queryParams,
        start_cursor: cursor,
        page_size: 100
      })
      return {
        results: response.results,
        next_cursor: response.next_cursor,
        has_more: response.has_more
      }
    }
  )

  // Limit results if specified
  const results = input.limit ? allResults.slice(0, input.limit) : allResults

  // Format results
  const formattedResults = results.map((page: any) => {
    const props: any = { page_id: page.id, url: page.url }

    for (const [key, prop] of Object.entries(page.properties)) {
      const p = prop as any
      if (p.type === 'title' && p.title) {
        props[key] = p.title.map((t: any) => t.plain_text).join('')
      } else if (p.type === 'rich_text' && p.rich_text) {
        props[key] = p.rich_text.map((t: any) => t.plain_text).join('')
      } else if (p.type === 'select' && p.select) {
        props[key] = p.select.name
      } else if (p.type === 'multi_select' && p.multi_select) {
        props[key] = p.multi_select.map((s: any) => s.name)
      } else if (p.type === 'number') {
        props[key] = p.number
      } else if (p.type === 'checkbox') {
        props[key] = p.checkbox
      } else if (p.type === 'url') {
        props[key] = p.url
      } else if (p.type === 'email') {
        props[key] = p.email
      } else if (p.type === 'phone_number') {
        props[key] = p.phone_number
      } else if (p.type === 'date' && p.date) {
        props[key] = p.date.start + (p.date.end ? ` to ${p.date.end}` : '')
      }
    }

    return props
  })

  return {
    action: 'query',
    database_id: input.database_id,
    total: formattedResults.length,
    results: formattedResults
  }
}

/**
 * Create pages in database (bulk)
 * Maps to: Multiple POST /v1/pages
 */
async function createDatabasePages(notion: Client, input: DatabasesInput): Promise<any> {
  if (!input.database_id) {
    throw new NotionMCPError('database_id required', 'VALIDATION_ERROR', 'Provide database_id')
  }

  const items = input.pages || (input.page_properties ? [{ properties: input.page_properties }] : [])

  if (items.length === 0) {
    throw new NotionMCPError('pages or page_properties required', 'VALIDATION_ERROR', 'Provide items to create')
  }

  const results = []

  for (const item of items) {
    const properties = convertToNotionProperties(item.properties)

    const page = await notion.pages.create({
      parent: { type: 'database_id', database_id: input.database_id },
      properties
    })

    results.push({
      page_id: page.id,
      url: (page as any).url,
      created: true
    })
  }

  return {
    action: 'create_page',
    database_id: input.database_id,
    processed: results.length,
    results
  }
}

/**
 * Update pages in database (bulk)
 * Maps to: Multiple PATCH /v1/pages/{id}
 */
async function updateDatabasePages(notion: Client, input: DatabasesInput): Promise<any> {
  const items = input.pages || (input.page_id && input.page_properties ?
    [{ page_id: input.page_id, properties: input.page_properties }] : [])

  if (items.length === 0) {
    throw new NotionMCPError('pages or page_id+page_properties required', 'VALIDATION_ERROR', 'Provide items to update')
  }

  const results = []

  for (const item of items) {
    if (!item.page_id) {
      throw new NotionMCPError('page_id required for each item', 'VALIDATION_ERROR', 'Provide page_id')
    }

    const properties = convertToNotionProperties(item.properties)

    await notion.pages.update({
      page_id: item.page_id,
      properties
    })

    results.push({
      page_id: item.page_id,
      updated: true
    })
  }

  return {
    action: 'update_page',
    processed: results.length,
    results
  }
}

/**
 * Delete pages in database (bulk archive)
 * Maps to: Multiple PATCH /v1/pages/{id} with archived: true
 */
async function deleteDatabasePages(notion: Client, input: DatabasesInput): Promise<any> {
  const pageIds = input.page_ids || (input.page_id ? [input.page_id] : []) ||
    (input.pages ? input.pages.map(p => p.page_id!).filter(Boolean) : [])

  if (pageIds.length === 0) {
    throw new NotionMCPError('page_id or page_ids required', 'VALIDATION_ERROR', 'Provide page IDs to delete')
  }

  const results = []

  for (const pageId of pageIds) {
    await notion.pages.update({
      page_id: pageId,
      archived: true
    })

    results.push({
      page_id: pageId,
      deleted: true
    })
  }

  return {
    action: 'delete_page',
    processed: results.length,
    results
  }
}
