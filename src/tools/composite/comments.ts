/**
 * Comments Composite Tool
 * Manage page comments
 */

import { Client } from '@notionhq/client'
import { withErrorHandling } from '../helpers/errors.js'
import { autoPaginate } from '../helpers/pagination.js'
import * as RichText from '../helpers/richtext.js'

export interface CommentsManageInput {
  page_id?: string
  discussion_id?: string
  action: 'list' | 'create' | 'resolve'
  content?: string  // For create action
}

/**
 * Manage comments (list, create, resolve)
 */
export async function commentsManage(
  notion: Client,
  input: CommentsManageInput
): Promise<any> {
  return withErrorHandling(async () => {
    switch (input.action) {
      case 'list': {
        if (!input.page_id) {
          throw new Error('page_id required for list action')
        }

        const comments = await autoPaginate(
          async (cursor) => {
            return await (notion.comments as any).list({
              block_id: input.page_id,
              start_cursor: cursor
            })
          }
        )

        return {
          page_id: input.page_id,
          total_comments: comments.length,
          comments: comments.map((comment: any) => ({
            id: comment.id,
            created_time: comment.created_time,
            created_by: comment.created_by,
            discussion_id: comment.discussion_id,
            text: RichText.extractPlainText(comment.rich_text),
            parent: comment.parent
          }))
        }
      }

      case 'create': {
        if (!input.page_id || !input.content) {
          throw new Error('page_id and content required for create action')
        }

        const comment = await (notion.comments as any).create({
          parent: {
            page_id: input.page_id
          },
          rich_text: [RichText.text(input.content)]
        })

        return {
          status: 'created',
          comment_id: comment.id,
          discussion_id: comment.discussion_id,
          message: 'Comment created successfully'
        }
      }

      default:
        throw new Error(`Unsupported action: ${input.action}`)
    }
  })()
}
