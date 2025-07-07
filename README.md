# QASE MCP Server

MCP server implementation for Qase API

This is a TypeScript-based MCP server that provides integration with the Qase test management platform. It implements core MCP concepts by providing tools for interacting with various Qase entities.

## Installation

You can use this package directly with npx:

```bash
npx -y qase-mcp-server --token YOUR_QASE_API_TOKEN
```

### Configuration Options

You can configure the server in several ways:

1. **Command line arguments**:
   ```bash
   npx -y qase-mcp-server --token YOUR_QASE_API_TOKEN --debug
   ```

2. **Environment variables**:
   ```bash
   export QASE_API_TOKEN=YOUR_QASE_API_TOKEN
   npx -y qase-mcp-server
   ```

3. **Configuration file** (default: `~/.qase-mcp-server.json`):
   ```json
   {
     "apiToken": "YOUR_QASE_API_TOKEN",
     "debug": true
   }
   ```

   You can specify a custom config file path:
   ```bash
   npx -y qase-mcp-server --config ./my-config.json
   ```

### Command Line Options

- `--token, -t <token>`: Qase API token
- `--config, -c <path>`: Path to config file
- `--debug, -d`: Enable debug mode
- `--help, -h`: Show help message

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

#### Defects
- `get_defects` - Get all defects in a project
- `get_defect` - Get a specific defect by ID
- `create_defect` - Create a new defect
- `update_defect` - Update an existing defect
- `delete_defect` - Delete a defect
- `resolve_defect` - Resolve a specific defect
- `update_defect_status` - Update the status of a defect

#### QQL Search
- `qql_search` - Search entities using Qase Query Language (QQL)

The QQL search tool allows you to perform advanced searches across various Qase entities using QQL expressions. This provides powerful filtering capabilities across test cases, defects, test runs, results, plans, and requirements.

**Parameters:**
- `query` (required): QQL expression string (1-1000 characters)
- `limit` (optional): Number of results to return (1-100, default: 10)
- `offset` (optional): Number of results to skip for pagination (0-100000, default: 0)

**Example QQL Queries:**

Test Cases:
```qql
entity = "case" and project = "DEMO" and title ~ "auth" order by id desc
entity = "case" and isFlaky = false and automation = "To be automated"
entity = "case" and status = "Actual" and created >= now("-14d")
entity = "case" and author = currentUser() and updated >= startOfWeek()
```

Defects:
```qql
entity = "defect" and status = "open"
entity = "defect" and severity = "blocker" and project = "DEMO"
entity = "defect" and created >= startOfWeek() and status != "resolved"
entity = "defect" and isResolved = false and milestone ~ "Sprint"
```

Test Results:
```qql
entity = "result" and status = "failed" and timeSpent > 5000 and milestone ~ "Sprint 12"
entity = "result" and status = "passed" and created >= now("-7d")
entity = "result" and status in ["failed", "blocked"] and created >= startOfDay()
```

Test Runs:
```qql
entity = "run" and status = "in progress" and project = "DEMO"
entity = "run" and author = currentUser() and created >= now("-30d")
entity = "run" and title ~ "regression" and status = "passed"
```

**QQL Features:**
- **Entities**: case, defect, result, run, plan, requirement
- **Operators**: `=`, `!=`, `~`, `>`, `<`, `>=`, `<=`, `in`, `not in`, `is empty`, `is not empty`
- **Logic**: `and`, `or`, `not`, parentheses for grouping
- **Functions**: `currentUser()`, `activeUsers()`, `now()`, `startOfDay()`, `startOfWeek()`, `startOfMonth()`, etc.
- **Sorting**: `ORDER BY field ASC/DESC`

For complete QQL reference, see the [Qase QQL documentation](https://help.qase.io/en/articles/5563727-queries).

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

## Integration with AI Assistants

### Claude Desktop

To use with Claude Desktop, add the server config:

- On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "qase": {
      "command": "npx",
      "args": ["-y", "qase-mcp-server"],
      "env": {
        "QASE_API_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### Zencoder

To use with Zencoder, add the following to your Zencoder MCP configuration:

```json
{
  "command": "npx",
  "args": ["-y", "qase-mcp-server"],
  "env": {
    "QASE_API_TOKEN": "<YOUR_TOKEN>"
  }
}
```

### Other MCP-Compatible AI Assistants

For other AI assistants that support MCP, follow their documentation for adding custom MCP servers. The general configuration format is:

```json
{
  "command": "npx",
  "args": ["-y", "qase-mcp-server"],
  "env": {
    "QASE_API_TOKEN": "<YOUR_TOKEN>"
  }
}
```

## Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
# Using the npx package
npx -y @modelcontextprotocol/inspector -e QASE_API_TOKEN=<YOUR_TOKEN> -- npx -y qase-mcp-server

# Or with debug mode enabled
npx -y @modelcontextprotocol/inspector -e QASE_API_TOKEN=<YOUR_TOKEN> -- npx -y qase-mcp-server --debug
```

You can also enable debug mode directly when running the server:

```bash
QASE_API_TOKEN=<YOUR_TOKEN> npx -y qase-mcp-server --debug
```

## Security Considerations

- Your Qase API token is sensitive information. Do not share it publicly.
- When using configuration files, ensure they have appropriate file permissions.
- The token is stored in memory during execution and can be passed via environment variables or command-line arguments.
- If you're concerned about command-line visibility, prefer using environment variables or configuration files.

## Troubleshooting

### Common Issues

1. **API Token Issues**
   - Error: "API token is required"
   - Solution: Ensure you've provided a valid Qase API token via `--token`, environment variable, or config file.

2. **Permission Issues**
   - Error: "Permission denied"
   - Solution: Ensure the executable has proper permissions. The build process should set these automatically.

3. **Node.js Version**
   - Error: "Unexpected token" or syntax errors
   - Solution: Ensure you're using Node.js version 18 or higher.

4. **Connection Issues**
   - Error: "Failed to connect to Qase API"
   - Solution: Check your internet connection and verify that your API token is valid.

For more help, run with the `--debug` flag to see additional diagnostic information.