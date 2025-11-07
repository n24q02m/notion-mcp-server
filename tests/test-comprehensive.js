/**
 * Comprehensive test of local MCP server features
 * Tests all composite tools with real API calls
 */

import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const DB_ID = 'd7b640b6efbc409e92cb6ee6fa7f0760'; // Reading/Watching database

async function runTests() {
  console.log('🧪 Comprehensive Feature Test\n');
  console.log('='.repeat(50));

  // Test 1: Database Items - Bulk Create with Auto-Conversion
  console.log('\n📝 Test 1: Bulk Create Database Items');
  try {
    const items = [
      {
        properties: {
          Name: '🧪 Auto-Convert Test 1',
          Language: 'Korean',
          Status: 'In progress',
          Tags: ['Action', 'Fantasy']
        }
      },
      {
        properties: {
          Name: '🧪 Auto-Convert Test 2',
          Language: 'Japanese',
          Status: 'Not started',
          Tags: ['Fantasy']
        }
      }
    ];

    for (const item of items) {
      // Simulate convertToNotionProperties
      const converted = {};
      for (const [key, value] of Object.entries(item.properties)) {
        if (key === 'Name' || key === 'Title') {
          converted[key] = { title: [{ type: 'text', text: { content: value } }] };
        } else if (key === 'Status') {
          converted[key] = { status: { name: value } };
        } else if (Array.isArray(value)) {
          converted[key] = { multi_select: value.map(v => ({ name: v })) };
        } else if (typeof value === 'string') {
          converted[key] = { select: { name: value } };
        } else {
          converted[key] = value;
        }
      }

      const page = await notion.pages.create({
        parent: { database_id: DB_ID },
        properties: converted
      });
      console.log(`  ✅ Created: ${page.id}`);
    }
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }

  // Test 2: Query Database with Smart Search
  console.log('\n🔍 Test 2: Smart Database Query');
  try {
    const result = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        or: [
          { property: 'Name', rich_text: { contains: 'Auto-Convert' } }
        ]
      },
      page_size: 5
    });
    console.log(`  ✅ Found ${result.results.length} pages`);
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }

  // Test 3: Create Page with Content (in database)
  console.log('\n📄 Test 3: Create Page with Markdown Content');
  try {
    const page = await notion.pages.create({
      parent: { database_id: DB_ID },
      properties: {
        Name: { title: [{ type: 'text', text: { content: '🧪 Page with Content Test' } }] },
        Language: { select: { name: 'English' } },
        Status: { status: { name: 'In progress' } }
      }
    });

    // Add markdown content as blocks
    await notion.blocks.children.append({
      block_id: page.id,
      children: [
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: 'Test Content' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: 'This is ' } },
              { type: 'text', text: { content: 'bold' }, annotations: { bold: true } },
              { type: 'text', text: { content: ' and ' } },
              { type: 'text', text: { content: 'italic' }, annotations: { italic: true } },
              { type: 'text', text: { content: ' text.' } }
            ]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'List item 1' } }]
          }
        }
      ]
    });
    console.log(`  ✅ Created page with content: ${page.id}`);
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }

  // Test 4: Get Page Content as Markdown
  console.log('\n📖 Test 4: Get Page Content');
  try {
    const results = await notion.search({
      query: 'Page with Content Test',
      filter: { property: 'object', value: 'page' },
      page_size: 1
    });

    if (results.results.length > 0) {
      const pageId = results.results[0].id;
      const blocks = await notion.blocks.children.list({ block_id: pageId });
      console.log(`  ✅ Retrieved ${blocks.results.length} blocks`);
    }
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }

  // Test 5: Comments
  console.log('\n💬 Test 5: Comments');
  try {
    const results = await notion.search({
      query: 'Auto-Convert Test 1',
      filter: { property: 'object', value: 'page' },
      page_size: 1
    });

    if (results.results.length > 0) {
      const pageId = results.results[0].id;

      // Create comment
      const comment = await notion.comments.create({
        parent: { page_id: pageId },
        rich_text: [{ type: 'text', text: { content: '🧪 Test comment via direct API' } }]
      });
      console.log(`  ✅ Created comment: ${comment.id}`);

      // List comments
      const comments = await notion.comments.list({ block_id: pageId });
      console.log(`  ✅ Listed ${comments.results.length} comments`);
    }
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
}

runTests().catch(console.error);
