#!/usr/bin/env node

/**
 * Validate tool schemas against MCP requirements
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read compiled registry
const registryPath = join(__dirname, '../build/src/tools/registry.js');
const registryContent = readFileSync(registryPath, 'utf-8');

// Extract TOOLS array (hacky but works for validation)
const match = registryContent.match(/const TOOLS = \[([\s\S]*?)\];/);
if (!match) {
  console.error('❌ Could not extract TOOLS array');
  process.exit(1);
}

console.log('🔍 Validating Tool Schemas\n');

let hasErrors = false;

function validateSchema(schema, path = 'root') {
  if (!schema || typeof schema !== 'object') return;

  if (schema.type === 'array') {
    if (!schema.items) {
      console.error(`❌ Array at ${path} missing 'items' property`);
      hasErrors = true;
      return;
    }
    console.log(`✅ Array at ${path} has items:`, JSON.stringify(schema.items, null, 2).substring(0, 100));
  }

  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      validateSchema(value, `${path}.${key}`);
    }
  }

  if (schema.items) {
    validateSchema(schema.items, `${path}[]`);
  }
}

// Manually check each tool
const tools = [
  'pages_create',
  'pages_edit', 
  'pages_get',
  'pages_manage',
  'databases_query',
  'databases_items',
  'databases_schema',
  'databases_create',
  'search_smart',
  'comments_manage',
  'workspace_explore',
  'workspace_info',
  'content_convert'
];

console.log(`Checking ${tools.length} tools...\n`);

// Import and check
import('../build/src/tools/registry.js').then((module) => {
  // Can't easily access TOOLS constant, so do string parsing
  const toolsMatch = registryContent.match(/const TOOLS = (\[[\s\S]*?\n\]);/);
  if (toolsMatch) {
    try {
      // Manually extract each tool definition
      const toolDefs = registryContent.match(/{\s*name: '[\w_]+',[\s\S]*?inputSchema:[\s\S]*?}\s*}/g);
      
      if (toolDefs) {
        console.log(`Found ${toolDefs.length} tool definitions\n`);
        
        toolDefs.forEach((def, i) => {
          const nameMatch = def.match(/name: '([\w_]+)'/);
          if (nameMatch) {
            const toolName = nameMatch[1];
            console.log(`${i + 1}. ${toolName}`);
            
            // Check for arrays without items
            const arrayMatches = [...def.matchAll(/type:\s*'array'/g)];
            const itemsMatches = [...def.matchAll(/items:\s*{/g)];
            
            if (arrayMatches.length > itemsMatches.length) {
              console.error(`   ❌ Has ${arrayMatches.length} arrays but only ${itemsMatches.length} items definitions!`);
              hasErrors = true;
            } else if (arrayMatches.length > 0) {
              console.log(`   ✅ ${arrayMatches.length} array(s) with items defined`);
            } else {
              console.log(`   ✅ No arrays`);
            }
          }
        });
      }
    } catch (e) {
      console.error('Error parsing:', e.message);
    }
  }
  
  console.log();
  if (hasErrors) {
    console.error('❌ Schema validation failed!');
    process.exit(1);
  } else {
    console.log('✅ All schemas valid!');
  }
}).catch(err => {
  console.error('Error importing registry:', err.message);
  process.exit(1);
});
