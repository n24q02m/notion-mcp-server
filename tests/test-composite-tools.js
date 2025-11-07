#!/usr/bin/env node

/**
 * Quick test script to verify composite tools are registered
 * Run: node test-composite-tools.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { registerTools } from './build/src/tools/registry.js'

async function test() {
  console.log('🧪 Testing Notion MCP Enhanced v2.0.0\n')

  // Create mock server
  const server = new Server(
    { name: 'test', version: '2.0.0' },
    { capabilities: { tools: {} } }
  )

  // Register tools with dummy token
  registerTools(server, 'test-token')

  // Create mock request to list tools
  const mockRequest = {
    method: 'tools/list',
    params: {}
  }

  // Get the handler
  const handlers = server._requestHandlers || server.requestHandlers
  if (!handlers) {
    console.error('❌ No request handlers found')
    console.log('Server keys:', Object.keys(server))
    process.exit(1)
  }

  // Try to get ListTools handler
  let handler
  if (handlers instanceof Map) {
    handler = handlers.get('tools/list')
  } else if (typeof handlers === 'object') {
    handler = handlers['tools/list']
  }

  if (!handler) {
    console.error('❌ No ListTools handler registered')
    console.log('Available handlers:', handlers instanceof Map ? Array.from(handlers.keys()) : Object.keys(handlers))
    process.exit(1)
  }

  const result = await handler(mockRequest)

  console.log('✅ Tools registered successfully!\n')
  console.log(`📊 Total tools: ${result.tools.length}\n`)
  
  console.log('📝 Tool names:')
  result.tools.forEach((tool, index) => {
    console.log(`  ${index + 1}. ${tool.name}`)
  })

  console.log('\n✨ Expected: 13 composite tools')
  console.log(`✨ Actual: ${result.tools.length} tools`)

  if (result.tools.length === 13) {
    console.log('\n✅ All composite tools registered correctly!')
    process.exit(0)
  } else {
    console.log('\n❌ Tool count mismatch!')
    process.exit(1)
  }
}

test().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
