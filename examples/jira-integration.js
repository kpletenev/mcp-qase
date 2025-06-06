/**
 * Example script demonstrating how to use the Jira integration features
 * 
 * To run this example:
 * 1. Set your QASE_API_TOKEN environment variable
 * 2. Replace the placeholder values with your actual project code, case ID, and Jira issue key
 * 3. Run with Node.js: node jira-integration.js
 */

// Import the MCP client library (this is a simplified example)
const { spawn } = require('child_process');
const path = require('path');

// Configuration
const PROJECT_CODE = 'ZEN'; // Replace with your Qase project code
const TEST_CASE_ID = 751;   // Replace with your test case ID
const JIRA_ISSUE_KEY = 'JIRA-123'; // Replace with your Jira issue key
const JIRA_TYPE = 'jira-cloud'; // or 'jira-server'

// Path to the MCP server executable
const MCP_SERVER_PATH = path.resolve(__dirname, '../build/index.js');

// Function to send a request to the MCP server
async function sendMcpRequest(toolName, args) {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('node', [MCP_SERVER_PATH], {
      env: {
        ...process.env,
        QASE_API_TOKEN: process.env.QASE_API_TOKEN
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    mcpProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    mcpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    mcpProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        // Parse the MCP response
        const response = JSON.parse(stdout);
        resolve(response);
      } catch (error) {
        reject(new Error(`Failed to parse MCP response: ${error.message}`));
      }
    });
    
    // Send the request to the MCP server
    const request = {
      type: 'call_tool',
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    mcpProcess.stdin.end();
  });
}

// Example 1: Link a test case to a Jira issue
async function linkTestCaseToJira() {
  try {
    const response = await sendMcpRequest('link_test_case_to_jira', {
      code: PROJECT_CODE,
      caseId: TEST_CASE_ID,
      jiraIssueKey: JIRA_ISSUE_KEY,
      jiraType: JIRA_TYPE
    });
    
    console.log('Successfully linked test case to Jira issue:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error linking test case to Jira issue:', error.message);
  }
}

// Example 2: Get test cases linked to a Jira issue
async function getTestCasesLinkedToJira() {
  try {
    const response = await sendMcpRequest('get_test_cases_linked_to_jira', {
      code: PROJECT_CODE,
      jiraIssueKey: JIRA_ISSUE_KEY,
      jiraType: JIRA_TYPE,
      limit: 10,
      offset: 0
    });
    
    console.log('Test cases linked to Jira issue:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error getting test cases linked to Jira issue:', error.message);
  }
}

// Run the examples
async function main() {
  console.log('Running Jira integration examples...');
  
  // First, link a test case to a Jira issue
  await linkTestCaseToJira();
  
  // Then, get test cases linked to the Jira issue
  await getTestCasesLinkedToJira();
}

main().catch(console.error);