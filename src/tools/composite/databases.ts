/**
 * Databases Composite Tools
 * Human-friendly database operations
 */

import { Client } from '@notionhq/client'
import { NotionMCPError, withErrorHandling } from '../helpers/errors.js'
import { autoPaginate } from '../helpers/pagination.js'
import * as RichText from '../helpers/richtext.js'

export interface DatabaseQueryInput {
  database_id: string
  filters?: any
  sorts?: any[]
  limit?: number
  search?: string  // Smart search across all text properties
}

export interface DatabaseItemsInput {
  database_id: string
  action: 'create' | 'update' | 'delete'
  items: Array<{
    page_id?: string  // Required for update/delete
    properties: Record<string, any>
  }>
}

/**
 * Query database with smart filtering and search
 */
export async function databasesQuery(
  notion: Client,
  input: DatabaseQueryInput
): Promise<any> {
  return withErrorHandling(async () => {
    // Get database schema first
    const database = await notion.databases.retrieve({
      database_id: input.database_id
    })

    let filter = input.filters

    // Smart search across text properties
    if (input.search && !filter) {
      const textProps = Object.entries((database as any).properties)
        .filter(([_, prop]: [string, any]) =>
          ['title', 'rich_text'].includes(prop.type)
        )
        .map(([name]) => name)

      if (textProps.length > 0) {
        // Create OR filter for all text properties
        filter = {
          or: textProps.map(propName => ({
            property: propName,
            rich_text: {
              contains: input.search
            }
          }))
        }
      }
    }

    // Query database
    const queryParams: any = {
      database_id: input.database_id
    }

    if (filter) queryParams.filter = filter
    if (input.sorts) queryParams.sorts = input.sorts

    // Fetch results with pagination
    const maxPages = input.limit ? Math.ceil(input.limit / 100) : 0
    const allResults = await autoPaginate(
      async (cursor) => {
        return await notion.databases.query({
          ...queryParams,
          start_cursor: cursor,
          page_size: 100
        }) as any
      },
      { maxPages }
    )

    // Apply limit if specified
    const results = input.limit
      ? allResults.slice(0, input.limit)
      : allResults

    // Format results
    const formattedResults = results.map((page: any) => ({
      page_id: page.id,
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      properties: formatProperties(page.properties)
    }))

    return {
      database_id: input.database_id,
      database_title: extractDatabaseTitle(database),
      total_results: formattedResults.length,
      results: formattedResults,
      schema: formatSchema((database as any).properties)
    }
  })()
}

/**
 * Bulk create/update/delete database items
 */
export async function databasesItems(
  notion: Client,
  input: DatabaseItemsInput
): Promise<any> {
  return withErrorHandling(async () => {
    const results = []

    for (const item of input.items) {
      try {
        let result

        switch (input.action) {
          case 'create':
            result = await notion.pages.create({
              parent: { database_id: input.database_id },
              properties: item.properties
            })
            results.push({
              status: 'created',
              page_id: result.id,
              url: (result as any).url
            })
            break

          case 'update':
            if (!item.page_id) {
              throw new NotionMCPError(
                'page_id required for update',
                'VALIDATION_ERROR',
                'Each item must have page_id for update action'
              )
            }
            result = await notion.pages.update({
              page_id: item.page_id,
              properties: item.properties
            })
            results.push({
              status: 'updated',
              page_id: result.id
            })
            break

          case 'delete':
            if (!item.page_id) {
              throw new NotionMCPError(
                'page_id required for delete',
                'VALIDATION_ERROR',
                'Each item must have page_id for delete action'
              )
            }
            await notion.pages.update({
              page_id: item.page_id,
              archived: true
            })
            results.push({
              status: 'deleted',
              page_id: item.page_id
            })
            break
        }
      } catch (error) {
        results.push({
          status: 'failed',
          page_id: item.page_id,
          error: (error as Error).message
        })
      }
    }

    return {
      action: input.action,
      database_id: input.database_id,
      processed: results.length,
      successful: results.filter(r => r.status !== 'failed').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    }
  })()
}

/**
 * Get database schema and structure
 */
export async function databasesSchema(
  notion: Client,
  database_id: string
): Promise<any> {
  return withErrorHandling(async () => {
    const database = await notion.databases.retrieve({ database_id })

    return {
      database_id: database.id,
      title: extractDatabaseTitle(database),
      description: (database as any).description,
      url: (database as any).url,
      created_time: (database as any).created_time,
      last_edited_time: (database as any).last_edited_time,
      schema: formatSchema((database as any).properties),
      is_inline: (database as any).is_inline
    }
  })()
}

/**
 * Create new database
 */
export async function databasesCreate(
  notion: Client,
  input: {
    parent_id: string
    title: string
    description?: string
    properties: Record<string, any>
    is_inline?: boolean
  }
): Promise<any> {
  return withErrorHandling(async () => {
    const database = await notion.databases.create({
      parent: input.parent_id.includes('-')
        ? { type: 'page_id', page_id: input.parent_id }
        : { type: 'workspace', workspace: true },
      title: [RichText.text(input.title)],
      description: input.description ? [RichText.text(input.description)] : [],
      properties: input.properties,
      is_inline: input.is_inline || false
    } as any)

    return {
      database_id: database.id,
      url: (database as any).url,
      title: input.title,
      message: 'Database created successfully'
    }
  })()
}

/**
 * Format properties for easier reading
 */
function formatProperties(properties: Record<string, any>): Record<string, any> {
  const formatted: Record<string, any> = {}

  for (const [name, prop] of Object.entries(properties)) {
    switch (prop.type) {
      case 'title':
        formatted[name] = prop.title.length > 0
          ? RichText.extractPlainText(prop.title)
          : ''
        break

      case 'rich_text':
        formatted[name] = prop.rich_text.length > 0
          ? RichText.extractPlainText(prop.rich_text)
          : ''
        break

      case 'number':
        formatted[name] = prop.number
        break

      case 'select':
        formatted[name] = prop.select?.name || null
        break

      case 'multi_select':
        formatted[name] = prop.multi_select.map((s: any) => s.name)
        break

      case 'date':
        formatted[name] = prop.date
        break

      case 'checkbox':
        formatted[name] = prop.checkbox
        break

      case 'url':
        formatted[name] = prop.url
        break

      case 'email':
        formatted[name] = prop.email
        break

      case 'phone_number':
        formatted[name] = prop.phone_number
        break

      case 'status':
        formatted[name] = prop.status?.name || null
        break

      case 'people':
        formatted[name] = prop.people.map((p: any) => ({
          id: p.id,
          name: p.name
        }))
        break

      case 'files':
        formatted[name] = prop.files.map((f: any) => ({
          name: f.name,
          url: f.file?.url || f.external?.url
        }))
        break

      case 'relation':
        formatted[name] = prop.relation.map((r: any) => r.id)
        break

      case 'rollup':
        formatted[name] = prop.rollup
        break

      case 'formula':
        formatted[name] = prop.formula
        break

      default:
        formatted[name] = prop
    }
  }

  return formatted
}

/**
 * Format schema for easier understanding
 */
function formatSchema(properties: Record<string, any>): Record<string, any> {
  const schema: Record<string, any> = {}

  for (const [name, prop] of Object.entries(properties)) {
    schema[name] = {
      type: prop.type,
      id: prop.id,
      ...(prop.type === 'select' && {
        options: prop.select?.options
      }),
      ...(prop.type === 'multi_select' && {
        options: prop.multi_select?.options
      }),
      ...(prop.type === 'status' && {
        options: prop.status?.options,
        groups: prop.status?.groups
      }),
      ...(prop.type === 'relation' && {
        database_id: prop.relation?.database_id
      }),
      ...(prop.type === 'rollup' && {
        relation_property: prop.rollup?.relation_property_name,
        rollup_property: prop.rollup?.rollup_property_name,
        function: prop.rollup?.function
      }),
      ...(prop.type === 'formula' && {
        expression: prop.formula?.expression
      })
    }
  }

  return schema
}

/**
 * Extract database title
 */
function extractDatabaseTitle(database: any): string {
  if (database.title && database.title.length > 0) {
    return RichText.extractPlainText(database.title)
  }
  return 'Untitled Database'
}
