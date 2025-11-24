/**
 * Property Helpers
 * Convert between human-friendly and Notion API formats
 */

import * as RichText from './richtext.js'

/**
 * Convert simple property values to Notion API format
 * Handles auto-detection of property types and conversion
 */
export function convertToNotionProperties(properties: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = {}

  for (const [key, value] of Object.entries(properties)) {
    if (value === null || value === undefined) {
      converted[key] = value
      continue
    }

    // Auto-detect property type and convert
    if (typeof value === 'string') {
      // Title properties
      if (key === 'Name' || key === 'Title' || key.toLowerCase() === 'title') {
        converted[key] = { title: [RichText.text(value)] }
      }
      // All other strings default to select
      // Note: User can override by passing Notion format directly
      else {
        converted[key] = { select: { name: value } }
      }
    } else if (typeof value === 'number') {
      converted[key] = { number: value }
    } else if (typeof value === 'boolean') {
      converted[key] = { checkbox: value }
    } else if (Array.isArray(value)) {
      // Could be multi_select, relation, people, files
      if (value.length > 0 && typeof value[0] === 'string') {
        // Assume multi_select
        converted[key] = {
          multi_select: value.map((v) => ({ name: v }))
        }
      } else {
        converted[key] = value
      }
    } else if (typeof value === 'object') {
      // Already in Notion format or date/complex object
      converted[key] = value
    } else {
      converted[key] = value
    }
  }

  return converted
}
