# Failed Test Results Tools

This document describes the new MCP tools for retrieving and analyzing failed test results from Qase.

## New Tools

### 1. `get_failed_results`

Retrieves failed test results from a Qase project with basic failure details.

**Parameters:**
- `code` (string, required): Project code
- `runId` (string|number, optional): Specific run ID to filter by
- `limit` (string|number, optional): Number of results to return (1-100, default: 50)
- `offset` (string|number, optional): Number of results to skip (default: 0)
- `fromEndTime` (string, optional): From end time in format Y-m-d H:i:s
- `toEndTime` (string, optional): To end time in format Y-m-d H:i:s

**Returns:**
- Basic failed test result information including:
  - Result hash and IDs
  - Status, comments, and stacktraces
  - Time spent and end time
  - Attachment information
  - Failed step details

### 2. `get_failed_results_detailed`

Retrieves failed test results with comprehensive test case information and enhanced details.

**Parameters:**
- Same as `get_failed_results` plus:
- `includeSteps` (boolean, optional): Include test case step details
- `includeAttachments` (boolean, optional): Include attachment details

**Returns:**
- All information from `get_failed_results` plus:
  - Complete test case information (title, description, suite info)
  - Test case properties (severity, priority, type, behavior, automation)
  - Optional step details when requested

### 3. `analyze_run_failures`

Analyzes failures in a specific test run with statistics and categorization.

**Parameters:**
- `code` (string, required): Project code
- `runId` (string|number, required): Run ID to analyze
- `includeStacktraces` (boolean, optional): Include full stacktrace details
- `categorizeFailures` (boolean, optional): Categorize failures by type

**Returns:**
- Run statistics (total, passed, failed, skipped, blocked, pass rate)
- Failure categorization by type (assertion errors, timeout errors, network errors, etc.)
- Detailed failure information for each failed test
- Analysis timestamp

## Usage Examples

### Get basic failed results for a project
```json
{
  "code": "PROJ",
  "limit": "20"
}
```

### Get failed results for a specific run with details
```json
{
  "code": "PROJ",
  "runId": "123",
  "includeSteps": true
}
```

### Analyze failures in a run with categorization
```json
{
  "code": "PROJ", 
  "runId": "123",
  "categorizeFailures": true,
  "includeStacktraces": true
}
```

## Features

- **Smart Filtering**: Automatically filters for failed status results
- **Enhanced Data**: Enriches results with test case metadata
- **Failure Analysis**: Categorizes failures by common patterns
- **Flexible Parameters**: Support for date ranges, pagination, and detailed options
- **Error Handling**: Graceful handling when test case details cannot be retrieved
- **Performance**: Optimized API calls with proper error handling

## Implementation Details

The tools use the existing Qase API client and follow the same patterns as other operations in the codebase:
- Built with TypeScript and Zod schemas for type safety
- Uses `ResultAsync` for error handling
- Follows existing code style and patterns
- Proper filtering and data transformation
- Enhanced with test case information from the cases API