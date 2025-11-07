/**
 * Content Conversion Tool
 * Convert between Markdown and Notion blocks
 */

import { withErrorHandling } from '../helpers/errors.js'
import { blocksToMarkdown, markdownToBlocks } from '../helpers/markdown.js'

export interface ContentConvertInput {
  direction: 'markdown-to-blocks' | 'blocks-to-markdown'
  content: string | any[]
}

/**
 * Convert content between formats
 */
export async function contentConvert(
  input: ContentConvertInput
): Promise<any> {
  return withErrorHandling(async () => {
    switch (input.direction) {
      case 'markdown-to-blocks': {
        if (typeof input.content !== 'string') {
          throw new Error('Content must be a string for markdown-to-blocks')
        }
        const blocks = markdownToBlocks(input.content)
        return {
          direction: input.direction,
          block_count: blocks.length,
          blocks
        }
      }

      case 'blocks-to-markdown': {
        if (!Array.isArray(input.content)) {
          throw new Error('Content must be an array for blocks-to-markdown')
        }
        const markdown = blocksToMarkdown(input.content as any)
        return {
          direction: input.direction,
          char_count: markdown.length,
          markdown
        }
      }

      default:
        throw new Error(`Unsupported direction: ${input.direction}`)
    }
  })()
}
