/**
 * Direct test of page creation to debug validation errors
 */

import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

async function testPageCreation() {
  console.log('🧪 Testing Page Creation Scenarios\n');

  // Test 1: Simple workspace page
  try {
    console.log('Test 1: Workspace page...');
    const page1 = await notion.pages.create({
      parent: { type: 'workspace', workspace: true },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: '🧪 Direct API Test - Workspace' } }]
        }
      }
    });
    console.log('✅ Success:', page1.id, page1.url);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 2: Page in database with simple properties
  try {
    console.log('\nTest 2: Database page with simple properties...');
    const page2 = await notion.pages.create({
      parent: { 
        type: 'database_id',
        database_id: 'd7b640b6efbc409e92cb6ee6fa7f0760' // Reading/Watching database
      },
      properties: {
        'Name': {
          title: [{ type: 'text', text: { content: '🧪 Direct API Test - DB Page' } }]
        },
        'Language': {
          select: { name: 'Korean' }
        },
        'Status': {
          status: { name: 'In progress' }
        },
        'Tags': {
          multi_select: [
            { name: 'Action' },
            { name: 'Fantasy' }
          ]
        }
      }
    });
    console.log('✅ Success:', page2.id, page2.url);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 3: Page with content
  try {
    console.log('\nTest 3: Page with markdown content...');
    const page3 = await notion.pages.create({
      parent: { type: 'workspace', workspace: true },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: '🧪 Test with Content' } }]
        }
      }
    });
    
    // Add content blocks
    await notion.blocks.children.append({
      block_id: page3.id,
      children: [
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: 'Test Heading' } }]
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
              { type: 'text', text: { content: 'italic' }, annotations: { italic: true } }
            ]
          }
        }
      ]
    });
    console.log('✅ Success:', page3.id, page3.url);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  console.log('\n✅ All tests completed!');
}

testPageCreation().catch(console.error);
