#!/usr/bin/env node

/**
 * Print tool schemas in MCP format
 */

import('../build/src/tools/registry.js').then(async (module) => {
  // Create mock server to get tools
  const mockServer = {
    setRequestHandler: (schema, handler) => {
      if (schema.method === 'tools/list') {
        handler().then(result => {
          console.log(JSON.stringify(result, null, 2));
        });
      }
    }
  };
  
  module.registerTools(mockServer, 'fake-token');
}).catch(err => {
  console.error('Error:', err);
});
