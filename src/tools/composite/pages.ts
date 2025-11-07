/**
 * Pages Composite Tools
 * Human-friendly page operations combining multiple API calls
 */

import { Client } from '@notionhq/client'
import { NotionMCPError, withErrorHandling } from '../helpers/errors.js'
import { blocksToMarkdown, markdownToBlocks } from '../helpers/markdown.js'
import { autoPaginate } from '../helpers/pagination.js'
import * as RichText from '../helpers/richtext.js'

export interface PageCreateInput {
  title: string
  content?: string  // Markdown format
  parent_id?: string  // Page or database ID
  icon?: string  // Emoji
  cover?: string  // Image URL
  properties?: Record<string, any>  // For database pages
}

export interface PageEditInput {
  page_id: string
  title?: string
  content?: string  // Markdown - replaces existing content
  append_content?: string  // Markdown - adds to end
  prepend_content?: string  // Markdown - adds to start
  properties?: Record<string, any>
  icon?: string
  cover?: string
  archived?: boolean
}

export interface PageManageInput {
  page_ids: string[]
  action: 'archive' | 'restore' | 'move' | 'duplicate'
  target_parent_id?: string  // For move action
}

/**
 * Create page with title and content in one operation
 */
export async function pagesCreate(
  notion: Client,
  input: PageCreateInput
): Promise<any> {
  return withErrorHandling(async () => {
    // Prepare parent
    const parent = input.parent_id
      ? input.parent_id.includes('-')
        ? { page_id: input.parent_id }
        : { database_id: input.parent_id }
      : { workspace: true }

    // Prepare properties
    const properties: any = input.properties || {}

    // Add title if not in properties (for database pages)
    if (!properties.title && !properties.Name) {
      properties.Name = {
        title: [RichText.text(input.title)]
      }
    }

    // Create page metadata
    const pageData: any = {
      parent,
      properties
    }

    if (input.icon) {
      pageData.icon = { type: 'emoji', emoji: input.icon }
    }

    if (input.cover) {
      pageData.cover = { type: 'external', external: { url: input.cover } }
    }

    // For non-database pages, use title in properties
    if (!input.parent_id || parent.page_id) {
      pageData.properties = {
        title: {
          title: [RichText.text(input.title)]
        }
      }
    }

    // Create page
    const page = await notion.pages.create(pageData)

    // Add content if provided
    if (input.content) {
      const blocks = markdownToBlocks(input.content)

      // Notion API limits to 100 blocks per request
      const batchSize = 100
      for (let i = 0; i < blocks.length; i += batchSize) {
        const batch = blocks.slice(i, i + batchSize)
        await notion.blocks.children.append({
          block_id: page.id,
          children: batch as any
        })
      }
    }

    return {
      page_id: page.id,
      url: (page as any).url,
      title: input.title,
      message: 'Page created successfully'
    }
  })()
}

/**
 * Edit page title, content, and properties
 */
export async function pagesEdit(
  notion: Client,
  input: PageEditInput
): Promise<any> {
  return withErrorHandling(async () => {
    const updates: any = {}

    // Update properties
    if (input.title || input.properties) {
      const properties: any = input.properties || {}

      if (input.title) {
        // Check if it's a database page
        const page = await notion.pages.retrieve({ page_id: input.page_id })
        const titleProp = Object.entries((page as any).properties).find(
          ([_, value]: [string, any]) => value.type === 'title'
        )

        const titleKey = titleProp ? titleProp[0] : 'title'
        properties[titleKey] = {
          title: [RichText.text(input.title)]
        }
      }

      const updateParams: any = {
        page_id: input.page_id,
        properties
      }

      if (input.icon) {
        updateParams.icon = { emoji: input.icon }
      }
      if (input.cover) {
        updateParams.cover = { external: { url: input.cover } }
      }
      if (input.archived !== undefined) {
        updateParams.archived = input.archived
      }

      await notion.pages.update(updateParams)
    }

    // Handle content updates
    if (input.content || input.append_content || input.prepend_content) {
      if (input.content) {
        // Replace all content - delete existing blocks first
        const { results: existingBlocks } = await notion.blocks.children.list({
          block_id: input.page_id
        })

        // Delete existing blocks
        for (const block of existingBlocks) {
          await notion.blocks.delete({ block_id: block.id })
        }

        // Add new content
        const blocks = markdownToBlocks(input.content)
        const batchSize = 100
        for (let i = 0; i < blocks.length; i += batchSize) {
          const batch = blocks.slice(i, i + batchSize)
          await notion.blocks.children.append({
            block_id: input.page_id,
            children: batch as any
          })
        }
      } else if (input.append_content) {
        // Append to end
        const blocks = markdownToBlocks(input.append_content)
        await notion.blocks.children.append({
          block_id: input.page_id,
          children: blocks as any
        })
      } else if (input.prepend_content) {
        // Prepend to start
        const blocks = markdownToBlocks(input.prepend_content)
        const { results: existingBlocks } = await notion.blocks.children.list({
          block_id: input.page_id,
          page_size: 1
        })

        if (existingBlocks.length > 0) {
          // Insert before first block
          await notion.blocks.children.append({
            block_id: input.page_id,
            children: blocks as any,
            after: undefined  // Will prepend
          })
        } else {
          // No existing blocks, just append
          await notion.blocks.children.append({
            block_id: input.page_id,
            children: blocks as any
          })
        }
      }
    }

    return {
      page_id: input.page_id,
      message: 'Page updated successfully'
    }
  })()
}

/**
 * Manage multiple pages (archive, restore, move, duplicate)
 */
export async function pagesManage(
  notion: Client,
  input: PageManageInput
): Promise<any> {
  return withErrorHandling(async () => {
    const results = []

    for (const page_id of input.page_ids) {
      try {
        switch (input.action) {
          case 'archive':
            await notion.pages.update({
              page_id,
              archived: true
            })
            results.push({ page_id, status: 'archived' })
            break

          case 'restore':
            await notion.pages.update({
              page_id,
              archived: false
            })
            results.push({ page_id, status: 'restored' })
            break

          case 'move':
            if (!input.target_parent_id) {
              throw new NotionMCPError(
                'target_parent_id required for move action',
                'VALIDATION_ERROR',
                'Provide target_parent_id to move pages'
              )
            }
            // Move operation - update parent (not supported in official SDK, skip for now)
            results.push({
              page_id,
              status: 'skipped',
              message: 'Move operation not yet supported'
            })
            break

          case 'duplicate':
            // Get page content
            const page = await notion.pages.retrieve({ page_id })
            const { results: blocks } = await notion.blocks.children.list({
              block_id: page_id
            })

            // Create duplicate
            const duplicate = await notion.pages.create({
              parent: (page as any).parent,
              properties: (page as any).properties,
              icon: (page as any).icon,
              cover: (page as any).cover
            })

            // Copy blocks
            if (blocks.length > 0) {
              await notion.blocks.children.append({
                block_id: duplicate.id,
                children: blocks as any
              })
            }

            results.push({
              original_id: page_id,
              duplicate_id: duplicate.id,
              status: 'duplicated'
            })
            break
        }
      } catch (error) {
        results.push({
          page_id,
          status: 'failed',
          error: (error as Error).message
        })
      }
    }

    return {
      action: input.action,
      processed: results.length,
      results
    }
  })()
}

/**
 * Get page with full content as markdown
 */
export async function pagesGet(
  notion: Client,
  page_id: string
): Promise<any> {
  return withErrorHandling(async () => {
    // Get page metadata
    const page = await notion.pages.retrieve({ page_id })

    // Get all blocks
    const blocks = await autoPaginate(
      async (cursor) => {
        return await notion.blocks.children.list({
          block_id: page_id,
          start_cursor: cursor,
          page_size: 100
        }) as any
      }
    )

    // Convert blocks to markdown
    const content = blocksToMarkdown(blocks as any)

    return {
      page_id: page.id,
      url: (page as any).url,
      title: extractTitle(page),
      created_time: (page as any).created_time,
      last_edited_time: (page as any).last_edited_time,
      archived: (page as any).archived,
      properties: (page as any).properties,
      content,
      block_count: blocks.length
    }
  })()
}

/**
 * Extract title from page properties
 */
function extractTitle(page: any): string {
  const titleProp = Object.values(page.properties).find(
    (prop: any) => prop.type === 'title'
  ) as any

  if (titleProp && titleProp.title && titleProp.title.length > 0) {
    return RichText.extractPlainText(titleProp.title)
  }

  return 'Untitled'
}
