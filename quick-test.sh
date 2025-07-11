#!/bin/bash

echo "🧪 Testing MCP Astronomical Time Server..."

# Test 1: List tools
echo -e "\n📋 Test 1: Listing available tools"
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | \
  docker run -i --rm mcp-astronomical-time-server | \
  head -n 20

# Test 2: Get current time in Amsterdam
echo -e "\n⏰ Test 2: Get current time in Amsterdam"
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "get_current_time", "arguments": {"timezone": "Europe/Amsterdam", "format": "human"}}, "id": 2}' | \
  docker run -i --rm mcp-astronomical-time-server | \
  tail -n 1 | jq .

# Test 3: Get moon phase
echo -e "\n🌙 Test 3: Get current moon phase"
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "get_moon_info", "arguments": {}}, "id": 3}' | \
  docker run -i --rm mcp-astronomical-time-server | \
  tail -n 1 | jq .

echo -e "\n✅ Tests completed!"