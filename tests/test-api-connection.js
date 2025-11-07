#!/usr/bin/env node

/**
 * Simple test - import and call tools directly
 */

import { Client } from '@notionhq/client';

const notionToken = process.env.NOTION_TOKEN;
if (!notionToken) {
  console.error('❌ NOTION_TOKEN required');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

console.log('🧪 Testing Notion API Connection\n');

// Test basic API call
try {
  const response = await notion.users.me();
  console.log('✅ Connected to Notion');
  console.log('Bot:', response.name || response.id);
  console.log('Type:', response.type);
  console.log();
  
  // Test search
  console.log('🔍 Testing search...');
  const searchResults = await notion.search({
    page_size: 5,
  });
  
  console.log(`Found ${searchResults.results.length} items`);
  searchResults.results.forEach((item, i) => {
    const title = item.properties?.title?.title?.[0]?.plain_text || 
                  item.properties?.Name?.title?.[0]?.plain_text ||
                  'Untitled';
    console.log(`${i + 1}. [${item.object}] ${title}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
