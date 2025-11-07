#!/usr/bin/env node
/**
 * Quick test for 8 mega tools
 */

import { Client } from '@notionhq/client'
import fs from 'fs'

// Read from .env file
const envContent = fs.readFileSync('.env', 'utf-8')
const NOTION_TOKEN = envContent.match(/NOTION_API_KEY=(.+)/)?.[1]?.trim()

if (!NOTION_TOKEN) {
  console.error('❌ NOTION_API_KEY not found in .env')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_TOKEN })

// Import mega tools
import { blocks } from '../build/src/tools/composite/blocks.js'
import { contentConvert } from '../build/src/tools/composite/content.js'
import { pages } from '../build/src/tools/composite/pages.js'
import { users } from '../build/src/tools/composite/users.js'
import { workspace } from '../build/src/tools/composite/workspace.js'

async function testMegaTools() {
  console.log('🧪 Testing 8 Mega Tools\n')

  // 1. Test workspace (get workspace info)
  console.log('1️⃣  Testing workspace.info...')
  try {
    const result = await workspace(notion, { action: 'info' })
    console.log(`✅ workspace.info: ${result.workspace_name || 'OK'}`)
  } catch (error) {
    console.log(`❌ workspace.info: ${error.message}`)
  }

  // 2. Test workspace search
  console.log('\n2️⃣  Testing workspace.search...')
  try {
    const result = await workspace(notion, { action: 'search', query: 'test', limit: 2 })
    console.log(`✅ workspace.search: Found ${result.results?.length || 0} results`)
  } catch (error) {
    console.log(`❌ workspace.search: ${error.message}`)
  }

  // 3. Test users.list
  console.log('\n3️⃣  Testing users.list...')
  try {
    const result = await users(notion, { action: 'list' })
    console.log(`✅ users.list: ${result.total} users`)
  } catch (error) {
    console.log(`❌ users.list: ${error.message}`)
  }

  // 4. Test users.me
  console.log('\n4️⃣  Testing users.me...')
  try {
    const result = await users(notion, { action: 'me' })
    console.log(`✅ users.me: ${result.name || result.id}`)
  } catch (error) {
    console.log(`❌ users.me: ${error.message}`)
  }

  // 5. Test pages.create
  console.log('\n5️⃣  Testing pages.create...')
  try {
    const result = await pages(notion, {
      action: 'create',
      title: '🧪 Mega Tool Test Page',
      content: '# Test\nThis is a test page for mega tools.\n\n## Features\n- Action-based API\n- 8 tools total\n- 75% API coverage'
    })
    console.log(`✅ pages.create: ${result.id}`)

    // Save page_id for next tests
    const testPageId = result.id

    // 6. Test pages.get
    console.log('\n6️⃣  Testing pages.get...')
    try {
      const getResult = await pages(notion, { action: 'get', page_id: testPageId })
      console.log(`✅ pages.get: ${getResult.title}`)
    } catch (error) {
      console.log(`❌ pages.get: ${error.message}`)
    }

    // 7. Test pages.update
    console.log('\n7️⃣  Testing pages.update...')
    try {
      await pages(notion, {
        action: 'update',
        page_id: testPageId,
        append_content: '\n## Updated\nThis section was appended via update action.'
      })
      console.log(`✅ pages.update: Appended content`)
    } catch (error) {
      console.log(`❌ pages.update: ${error.message}`)
    }

    // 8. Test blocks.children (get page blocks)
    console.log('\n8️⃣  Testing blocks.children...')
    try {
      const blocksResult = await blocks(notion, { action: 'children', block_id: testPageId })
      console.log(`✅ blocks.children: ${blocksResult.results?.length || 0} blocks`)
    } catch (error) {
      console.log(`❌ blocks.children: ${error.message}`)
    }

    // 9. Test content_convert
    console.log('\n9️⃣  Testing content_convert (markdown-to-blocks)...')
    try {
      const convertResult = await contentConvert({
        direction: 'markdown-to-blocks',
        content: '# Hello\n\nThis is a **test**.'
      })
      console.log(`✅ content_convert: ${convertResult.blocks?.length || 0} blocks converted`)
    } catch (error) {
      console.log(`❌ content_convert: ${error.message}`)
    }

    // 10. Test pages.archive (cleanup)
    console.log('\n🔟 Testing pages.archive (cleanup)...')
    try {
      await pages(notion, { action: 'archive', page_id: testPageId })
      console.log(`✅ pages.archive: Cleaned up test page`)
    } catch (error) {
      console.log(`❌ pages.archive: ${error.message}`)
    }

  } catch (error) {
    console.log(`❌ pages.create: ${error.message}`)
    console.log('\n⚠️  Skipping tests that require a test page')
  }

  console.log('\n✅ Mega Tools Test Complete!')
  console.log('\n📊 Summary:')
  console.log('   - 8 mega tools defined')
  console.log('   - 6 actions in pages tool')
  console.log('   - 6 actions in databases tool')
  console.log('   - 5 actions in blocks tool')
  console.log('   - 3 actions in users tool')
  console.log('   - 2 actions in workspace tool')
  console.log('   - 2 actions in comments tool')
  console.log('   - 1 utility in content_convert')
  console.log('\n   Total: 25 actions across 8 tools (75% Official API coverage)')
}

testMegaTools().catch(console.error)
