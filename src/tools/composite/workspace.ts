/**
 * Workspace Composite Tool
 * Navigate recent and shared content
 */

import { Client } from '@notionhq/client'
import { withErrorHandling } from '../helpers/errors.js'
import * as RichText from '../helpers/richtext.js'

export interface WorkspaceExploreInput {
  view: 'recent' | 'shared' | 'all'
  filter?: {
    object?: 'page' | 'database'
  }
  limit?: number
}

/**
 * Explore workspace content
 */
export async function workspaceExplore(
  notion: Client,
  input: WorkspaceExploreInput
): Promise<any> {
  return withErrorHandling(async () => {
    const searchParams: any = {
      query: '',
      page_size: Math.min(input.limit || 100, 100),
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      }
    }

    if (input.filter) {
      searchParams.filter = input.filter
    }

    const response = await notion.search(searchParams)

    const results = response.results.map((item: any) => {
      const common = {
        id: item.id,
        url: item.url,
        created_time: item.created_time,
        last_edited_time: item.last_edited_time,
        archived: item.archived
      }

      if (item.object === 'page') {
        return {
          ...common,
          type: 'page',
          title: extractTitle(item),
          parent: formatParent(item.parent)
        }
      } else if (item.object === 'database') {
        return {
          ...common,
          type: 'database',
          title: extractDatabaseTitle(item)
        }
      }

      return common
    })

    return {
      view: input.view,
      total_results: results.length,
      results
    }
  })()
}

/**
 * Get workspace information
 */
export async function workspaceInfo(
  notion: Client
): Promise<any> {
  return withErrorHandling(async () => {
    // Get bot user info
    const botInfo = await (notion.users as any).me()

    return {
      bot_id: botInfo.id,
      bot_name: botInfo.name,
      owner_type: botInfo.owner?.type,
      workspace_name: botInfo.owner?.workspace ? 'true' : 'false'
    }
  })()
}

function extractTitle(page: any): string {
  if (!page.properties) return 'Untitled'

  const titleProp = Object.values(page.properties).find(
    (prop: any) => prop.type === 'title'
  ) as any

  if (titleProp && titleProp.title && titleProp.title.length > 0) {
    return RichText.extractPlainText(titleProp.title)
  }

  return 'Untitled'
}

function extractDatabaseTitle(database: any): string {
  if (database.title && database.title.length > 0) {
    return RichText.extractPlainText(database.title)
  }
  return 'Untitled Database'
}

function formatParent(parent: any): any {
  if (parent.type === 'workspace') {
    return { type: 'workspace' }
  } else if (parent.type === 'page_id') {
    return { type: 'page', id: parent.page_id }
  } else if (parent.type === 'database_id') {
    return { type: 'database', id: parent.database_id }
  }
  return parent
}
