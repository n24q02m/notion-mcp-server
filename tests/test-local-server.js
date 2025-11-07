#!/usr/bin/env node

/**
 * Test local MCP server tools
 * Usage: NOTION_TOKEN=xxx node tests/test-local-server.js
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function testLocalServer() {
  console.log('🧪 Testing Local MCP Server\n');

  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken) {
    console.error('❌ NOTION_TOKEN environment variable required');
    process.exit(1);
  }

  // Start local server
  const cliPath = join(projectRoot, 'bin/cli.mjs');
  
  // Create MCP client with stdio transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: [cliPath],
    env: {
      ...process.env,
      NOTION_TOKEN: notionToken,
    },
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to local server\n');

    // List tools
    const { tools } = await client.listTools();
    console.log(`📦 Tools Available: ${tools.length}\n`);

    tools.forEach((tool, i) => {
      console.log(`${i + 1}. ${tool.name}`);
      console.log(`   ${tool.description}`);
      console.log();
    });

    // Test workspace_info (doesn't need input)
    console.log('🧪 Testing workspace_info...');
    const result = await client.callTool({
      name: 'workspace_info',
      arguments: {},
    });
    console.log('✅ Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testLocalServer().catch(console.error);
