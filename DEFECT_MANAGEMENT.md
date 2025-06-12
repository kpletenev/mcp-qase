# Defect Management Endpoints - QASE MCP Server

This document describes the comprehensive defect management functionality added to the QASE-MCP server.

## Overview

The QASE-MCP server now includes full CRUD operations for defect management, enabling complete defect lifecycle management through the QASE API.

## Available Endpoints

### 1. Get All Defects
- **Endpoint**: `get_defects`
- **Purpose**: Retrieve a list of all defects in a project
- **Parameters**:
  - `code` (string, required): Project code
  - `status` (string, optional): Filter by status (`open`, `resolved`, `in_progress`, `invalid`)
  - `limit` (number, optional): Number of entities to return
  - `offset` (number, optional): Number of entities to skip

**Example**:
```json
{
  "code": "DEMO",
  "status": "open",
  "limit": 10,
  "offset": 0
}
```

### 2. Get Specific Defect
- **Endpoint**: `get_defect`
- **Purpose**: Retrieve detailed information about a single defect
- **Parameters**:
  - `code` (string, required): Project code
  - `id` (number, required): Defect ID

**Example**:
```json
{
  "code": "DEMO",
  "id": 123
}
```

### 3. Create New Defect
- **Endpoint**: `create_defect`
- **Purpose**: Create a new defect entry
- **Parameters**:
  - `code` (string, required): Project code
  - `defect` (object, required): Defect details
    - `title` (string, required): Defect title
    - `actual_result` (string, required): Description of the defect
    - `severity` (number, required): Severity level (1=Critical, 2=High, 3=Medium, 4=Low)
    - `milestone_id` (number, optional): Associated milestone ID
    - `attachments` (array, optional): Array of attachment hashes
    - `custom_field` (object, optional): Custom field values (id => value)
    - `tags` (array, optional): Array of tag strings

**Example**:
```json
{
  "code": "DEMO",
  "defect": {
    "title": "Login button not responding",
    "actual_result": "Button doesn't respond to clicks on mobile devices",
    "severity": 1,
    "tags": ["mobile", "login", "critical"]
  }
}
```

### 4. Update Defect
- **Endpoint**: `update_defect`
- **Purpose**: Modify defect details
- **Parameters**:
  - `code` (string, required): Project code
  - `id` (number, required): Defect ID
  - All other fields from create are optional for updates

**Example**:
```json
{
  "code": "DEMO",
  "id": 123,
  "title": "Login button not responding [INVESTIGATING]",
  "actual_result": "Updated with investigation notes...",
  "severity": 2
}
```

### 5. Delete Defect
- **Endpoint**: `delete_defect`
- **Purpose**: Remove a defect from the system
- **Parameters**:
  - `code` (string, required): Project code
  - `id` (number, required): Defect ID

**Example**:
```json
{
  "code": "DEMO",
  "id": 123
}
```

### 6. Resolve Defect
- **Endpoint**: `resolve_defect`
- **Purpose**: Mark a defect as resolved
- **Parameters**:
  - `code` (string, required): Project code
  - `id` (number, required): Defect ID

**Example**:
```json
{
  "code": "DEMO",
  "id": 123
}
```

### 7. Update Defect Status
- **Endpoint**: `update_defect_status`
- **Purpose**: Change the status of a defect
- **Parameters**:
  - `code` (string, required): Project code
  - `id` (number, required): Defect ID
  - `status` (string, required): New status (`in_progress`, `resolved`, `invalid`)

**Example**:
```json
{
  "code": "DEMO",
  "id": 123,
  "status": "in_progress"
}
```

## Defect Lifecycle States

The defect management system supports the following lifecycle states:

1. **open** - Default state for new defects
2. **in_progress** - Defect is being actively worked on
3. **resolved** - Defect has been fixed and verified
4. **invalid** - Defect is not valid (duplicate, not reproducible, etc.)

## Severity Levels

Defects can be assigned severity levels:

- **1** - Critical/Blocker
- **2** - High
- **3** - Medium  
- **4** - Low

## Best Practices

### Creating Defects
- Use descriptive titles that summarize the issue
- Provide detailed `actual_result` with steps to reproduce
- Include expected vs actual behavior
- Set appropriate severity level
- Use tags for categorization (e.g., "mobile", "ui", "api")

### Managing Defect Lifecycle
1. Create defect in `open` status
2. Move to `in_progress` when work begins
3. Add investigation/resolution notes via updates
4. Use `resolve_defect` when fixed and verified
5. Use `invalid` status for non-issues

### Tracking and Reporting
- Use status filters to get defects by state
- Monitor defect counts by severity
- Track resolution times
- Use tags for reporting by component/feature

## Testing

Two test scripts are provided:

### 1. Comprehensive API Testing
```bash
node test-defects.js
```
Tests all endpoints with both direct API calls and MCP operations.

### 2. Workflow Demonstration
```bash
node test-defects-usage.js
```
Demonstrates a complete defect lifecycle from creation to resolution.

## Implementation Details

### Files Modified/Added:
- `src/operations/defects.ts` - New defect operations
- `src/index.ts` - Added defect endpoints to MCP server
- `test-defects.js` - Comprehensive test suite
- `test-defects-usage.js` - Workflow demonstration

### Error Handling:
- Validates defect IDs and project codes
- Handles non-existent defects gracefully
- Provides meaningful error messages
- Manages API connection issues

### Integration:
- Follows existing QASE-MCP server patterns
- Uses consistent error handling with neverthrow
- Implements proper type safety with Zod schemas
- Maintains compatibility with existing workflows

## Usage Examples

The test scripts demonstrate practical usage patterns including:
- Bulk defect retrieval with filtering
- Creating defects with comprehensive details
- Status transition workflows
- Adding investigation and resolution notes
- Statistical reporting and monitoring
- Proper cleanup procedures

This implementation provides a complete defect management solution that integrates seamlessly with existing test management workflows in the QASE-MCP server.