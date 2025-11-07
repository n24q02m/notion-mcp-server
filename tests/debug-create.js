#!/usr/bin/env node
/**
 * Debug script to test pages_create directly
 */

import { Client } from '@notionhq/client';
import { pagesCreate } from '../build/src/tools/composite/pages.js';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function test() {
  try {
    console.log('Testing pages_create...');
    const result = await pagesCreate(notion, {
      title: 'Debug Test Page'
    });
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    if (error.body) {
      console.error('API Error Body:', JSON.stringify(error.body, null, 2));
    }
  }
}

test();
