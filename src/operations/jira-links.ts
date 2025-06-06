import { z } from 'zod';
import { client, toResult } from '../utils.js';
import { pipe } from 'ramda';
import { TestCaseexternalIssuesTypeEnum } from 'qaseio';

// Schema for linking a test case to a Jira issue
export const LinkTestCaseToJiraSchema = z.object({
  code: z.string().describe('Qase project code'),
  caseId: z.number().describe('Qase test case ID'),
  jiraIssueKey: z.string().describe('Jira issue key (e.g., PROJ-123)'),
  jiraType: z.enum(['jira-cloud', 'jira-server']).default('jira-cloud').describe('Jira integration type')
});

// Schema for getting test cases linked to a Jira issue
export const GetTestCasesLinkedToJiraSchema = z.object({
  code: z.string().describe('Qase project code'),
  jiraIssueKey: z.string().describe('Jira issue key (e.g., PROJ-123)'),
  jiraType: z.enum(['jira-cloud', 'jira-server']).default('jira-cloud').describe('Jira integration type'),
  limit: z.number().optional().describe('Number of results per page'),
  offset: z.number().optional().describe('Offset for pagination')
});

/**
 * Link a test case to a Jira issue
 * 
 * This function uses the Qase API to create a link between a test case and a Jira issue.
 */
export const linkTestCaseToJira = pipe(
  async (code: string, caseId: number, jiraIssueKey: string, jiraType: 'jira-cloud' | 'jira-server' = 'jira-cloud') => {
    try {
      // Use the caseAttachExternalIssue API to link the test case to the Jira issue
      const response = await client.cases.caseAttachExternalIssue(code, {
        type: jiraType === 'jira-cloud' ? TestCaseexternalIssuesTypeEnum.CLOUD : TestCaseexternalIssuesTypeEnum.SERVER,
        links: [
          {
            case_id: caseId,
            external_issues: [jiraIssueKey]
          }
        ]
      });
      
      // Return the response in the format expected by the MCP server
      return response;
    } catch (error) {
      console.error('Error linking test case to Jira:', error);
      throw error;
    }
  },
  (promise: any) => toResult(promise)
);

/**
 * Get test cases linked to a specific Jira issue
 */
export const getTestCasesLinkedToJira = pipe(
  async (code: string, jiraIssueKey: string, jiraType: 'jira-cloud' | 'jira-server' = 'jira-cloud', limit?: number, offset?: number) => {
    try {
      // Use the getCases API with filters for external issues
      const response = await client.cases.getCases(
        code, 
        undefined, // search
        undefined, // milestoneId
        undefined, // suiteId
        undefined, // severity
        undefined, // priority
        undefined, // type
        undefined, // behavior
        undefined, // automation
        undefined, // status
        jiraType,  // externalIssuesType
        [jiraIssueKey], // externalIssuesIds
        undefined, // include
        limit,     // limit
        offset     // offset
      );
      
      // Return the response in the format expected by the MCP server
      return response;
    } catch (error) {
      console.error('Error getting test cases linked to Jira:', error);
      throw error;
    }
  },
  (promise: any) => toResult(promise)
);