# QASE MCP Server

MCP server implementation for Qase API

This is a TypeScript-based MCP server that provides integration with the Qase test management platform. It implements core MCP concepts by providing tools for interacting with various Qase entities.

## Features

### Tools
The server provides tools for interacting with the Qase API, allowing you to manage the following entities:

#### Projects
- `list_projects` - Get all projects
- `get_project` - Get project by code
- `create_project` - Create new project
- `delete_project` - Delete project by code

#### Test Cases
- `get_cases` - Get all test cases in a project
- `get_case` - Get a specific test case
- `create_case` - Create a new test case
- `update_case` - Update an existing test case

#### Test Runs
- `get_runs` - Get all test runs in a project
- `get_run` - Get a specific test run

#### Test Results
- `get_results` - Get all test run results for a project
- `get_result` - Get test run result by code and hash
- `create_result` - Create test run result
- `create_result_bulk` - Create multiple test run results in bulk
- `update_result` - Update an existing test run result

#### Test Plans
- `get_plans` - Get all test plans in a project
- `get_plan` - Get a specific test plan
- `create_plan` - Create a new test plan
- `update_plan` - Update an existing test plan
- `delete_plan` - Delete a test plan

#### Test Suites
- `get_suites` - Get all test suites in a project
- `get_suite` - Get a specific test suite
- `create_suite` - Create a new test suite
- `update_suite` - Update an existing test suite
- `delete_suite` - Delete a test suite

#### Shared Steps
- `get_shared_steps` - Get all shared steps in a project
- `get_shared_step` - Get a specific shared step
- `create_shared_step` - Create a new shared step
- `update_shared_step` - Update an existing shared step
- `delete_shared_step` - Delete a shared step

#### Jira Integration
- `link_test_case_to_jira` - Link a test case to a Jira issue
- `get_test_cases_linked_to_jira` - Get test cases linked to a specific Jira issue

## Using Jira Integration

### Linking Test Cases to Jira Issues

You can link a test case to a Jira issue using the `link_test_case_to_jira` tool:

```json
{
  "code": "YOUR_PROJECT_CODE",
  "caseId": 123,
  "jiraIssueKey": "JIRA-456",
  "jiraType": "jira-cloud"
}
```

Parameters:
- `code`: Your Qase project code (e.g., "ZEN")
- `caseId`: The ID of the test case in Qase
- `jiraIssueKey`: The Jira issue key (e.g., "JIRA-123")
- `jiraType`: Either "jira-cloud" or "jira-server" depending on your Jira setup

### Finding Test Cases Linked to Jira Issues

You can find all test cases linked to a specific Jira issue using the `get_test_cases_linked_to_jira` tool:

```json
{
  "code": "YOUR_PROJECT_CODE",
  "jiraIssueKey": "JIRA-456",
  "jiraType": "jira-cloud",
  "limit": 10,
  "offset": 0
}
```

Parameters:
- `code`: Your Qase project code (e.g., "ZEN")
- `jiraIssueKey`: The Jira issue key (e.g., "JIRA-123")
- `jiraType`: Either "jira-cloud" or "jira-server" depending on your Jira setup
- `limit`: (Optional) Maximum number of results to return
- `offset`: (Optional) Offset for pagination

### Prerequisites for Jira Integration

Before using these tools, make sure:

1. You have set up the Jira integration in your Qase account
2. Your Qase API token has the necessary permissions
3. The Jira project and Qase project are properly configured for integration

### Example Script

Check out the example script in the `examples/jira-integration.js` file for a demonstration of how to use the Jira integration features programmatically.

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

### Claude Desktop

To use with Claude Desktop, add the server config:

- On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-qase": {
      "command": "/path/to/mcp-qase/build/index.js",
      "env": {
        "QASE_API_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### Cursor

To use with Cursor, register the command as follows:

```
env QASE_API_TOKEN=<YOUR_TOKEN> /path/to/mcp-qase/build/index.js
```

## Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx -y @modelcontextprotocol/inspector -e QASE_API_TOKEN=<YOUR_TOKEN> ./build/index.js
```