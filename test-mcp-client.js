#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

// Start the MCP server
const server = spawn('docker', ['run', '-i', '--rm', 'mcp-astronomical-time-server']);

// Create readline interface for output
const rl = readline.createInterface({
  input: server.stdout,
  output: process.stdout,
  terminal: false
});

// Handle server output
rl.on('line', (line) => {
  if (line.trim()) {
    console.log('Server response:', line);
    try {
      const response = JSON.parse(line);
      console.log('Parsed response:', JSON.stringify(response, null, 2));
    } catch (e) {
      // Not JSON, just log as is
    }
  }
});

// Handle errors
server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Send test requests
const sendRequest = (request) => {
  console.log('\nSending request:', JSON.stringify(request));
  server.stdin.write(JSON.stringify(request) + '\n');
};

// Wait for server to start
setTimeout(() => {
  // Test 1: List available tools
  sendRequest({
    jsonrpc: "2.0",
    method: "tools/list",
    id: 1
  });

  // Test 2: Get current time
  setTimeout(() => {
    sendRequest({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "get_current_time",
        arguments: {
          timezone: "Europe/Amsterdam",
          format: "human"
        }
      },
      id: 2
    });
  }, 1000);

  // Test 3: Get sun info
  setTimeout(() => {
    sendRequest({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "get_sun_info",
        arguments: {
          latitude: 52.3676,
          longitude: 4.9041,
          timezone: "Europe/Amsterdam"
        }
      },
      id: 3
    });
  }, 2000);

  // Test 4: Get Dutch holidays
  setTimeout(() => {
    sendRequest({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "get_dutch_holidays",
        arguments: {
          year: 2024
        }
      },
      id: 4
    });
  }, 3000);

  // Exit after tests
  setTimeout(() => {
    console.log('\nTests completed!');
    server.kill();
    process.exit(0);
  }, 5000);
}, 1000);