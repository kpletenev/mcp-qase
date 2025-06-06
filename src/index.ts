#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  listProjects,
  getProject,
  createProject,
  CreateProjectSchema,
  GetProjectSchema,
  ListProjectsSchema,
} from './operations/projects.js';
import {
  getResults,
  getResult,
  createResult,
  CreateResultSchema,
  GetResultSchema,
  GetResultsSchema,
  CreateResultBulkSchema,
  createResultBulk,
  UpdateResultSchema,
  updateResult,
} from './operations/results.js';
import {
  getCases,
  getCase,
  createCase,
  updateCase,
  GetCasesSchema,
  GetCaseSchema,
  CreateCaseSchema,
  UpdateCaseSchema,
} from './operations/cases.js';
import {
  getRuns,
  getRun,
  GetRunsSchema,
  GetRunSchema,
} from './operations/runs.js';
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  GetPlansSchema,
  GetPlanSchema,
  CreatePlanSchema,
  UpdatePlanSchema,
} from './operations/plans.js';
import {
  GetSuitesSchema,
  GetSuiteSchema,
  CreateSuiteSchema,
  UpdateSuiteSchema,
  getSuites,
  getSuite,
  createSuite,
  updateSuite,
} from './operations/suites.js';
import {
  GetSharedStepsSchema,
  GetSharedStepSchema,
  CreateSharedStepSchema,
  UpdateSharedStepSchema,
  getSharedSteps,
  getSharedStep,
  createSharedStep,
  updateSharedStep,
} from './operations/shared-steps.js';
import {
  LinkTestCaseToJiraSchema,
  GetTestCasesLinkedToJiraSchema,
  linkTestCaseToJira,
  getTestCasesLinkedToJira,
} from './operations/jira-links.js';
import { match } from 'ts-pattern';
import { errAsync } from 'neverthrow';

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: 'mcp-qase',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  },
);

/**
 * Handler for listing available notes as resources.
 */
server.setRequestHandler(ListResourcesRequestSchema, () => ({
  resources: [],
}));

/**
 * Handler for reading the contents
 */
server.setRequestHandler(ReadResourceRequestSchema, () => ({
  contents: [],
}));

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: [
    {
      name: 'list_projects',
      description: 'Get All Projects',
      inputSchema: zodToJsonSchema(ListProjectsSchema),
    },
    {
      name: 'get_project',
      description: 'Get project by code',
      inputSchema: zodToJsonSchema(GetProjectSchema),
    },
    {
      name: 'create_project',
      description: 'Create new project',
      inputSchema: zodToJsonSchema(CreateProjectSchema),
    },
    {
      name: 'get_results',
      description: 'Get all test run results for a project',
      inputSchema: zodToJsonSchema(GetResultsSchema),
    },
    {
      name: 'get_result',
      description: 'Get test run result by code and hash',
      inputSchema: zodToJsonSchema(GetResultSchema),
    },
    {
      name: 'create_result',
      description: 'Create test run result',
      inputSchema: zodToJsonSchema(CreateResultSchema),
    },
    {
      name: 'create_result_bulk',
      description: 'Create multiple test run results in bulk',
      inputSchema: zodToJsonSchema(CreateResultBulkSchema),
    },
    {
      name: 'update_result',
      description: 'Update an existing test run result',
      inputSchema: zodToJsonSchema(UpdateResultSchema),
    },
    {
      name: 'get_cases',
      description: 'Get all test cases in a project',
      inputSchema: zodToJsonSchema(GetCasesSchema),
    },
    {
      name: 'get_case',
      description: 'Get a specific test case',
      inputSchema: zodToJsonSchema(GetCaseSchema),
    },
    {
      name: 'create_case',
      description: 'Create a new test case',
      inputSchema: zodToJsonSchema(CreateCaseSchema),
    },
    {
      name: 'update_case',
      description: 'Update an existing test case',
      inputSchema: zodToJsonSchema(UpdateCaseSchema),
    },
    {
      name: 'get_runs',
      description: 'Get all test runs in a project',
      inputSchema: zodToJsonSchema(GetRunsSchema),
    },
    {
      name: 'get_run',
      description: 'Get a specific test run',
      inputSchema: zodToJsonSchema(GetRunSchema),
    },
    {
      name: 'get_plans',
      description: 'Get all test plans in a project',
      inputSchema: zodToJsonSchema(GetPlansSchema),
    },
    {
      name: 'get_plan',
      description: 'Get a specific test plan',
      inputSchema: zodToJsonSchema(GetPlanSchema),
    },
    {
      name: 'create_plan',
      description: 'Create a new test plan',
      inputSchema: zodToJsonSchema(CreatePlanSchema),
    },
    {
      name: 'update_plan',
      description: 'Update an existing test plan',
      inputSchema: zodToJsonSchema(UpdatePlanSchema),
    },
    {
      name: 'get_suites',
      description: 'Get all test suites in a project',
      inputSchema: zodToJsonSchema(GetSuitesSchema),
    },
    {
      name: 'get_suite',
      description: 'Get a specific test suite',
      inputSchema: zodToJsonSchema(GetSuiteSchema),
    },
    {
      name: 'create_suite',
      description: 'Create a new test suite',
      inputSchema: zodToJsonSchema(CreateSuiteSchema),
    },
    {
      name: 'update_suite',
      description: 'Update an existing test suite',
      inputSchema: zodToJsonSchema(UpdateSuiteSchema),
    },
    {
      name: 'get_shared_steps',
      description: 'Get all shared steps in a project',
      inputSchema: zodToJsonSchema(GetSharedStepsSchema),
    },
    {
      name: 'get_shared_step',
      description: 'Get a specific shared step',
      inputSchema: zodToJsonSchema(GetSharedStepSchema),
    },
    {
      name: 'create_shared_step',
      description: 'Create a new shared step',
      inputSchema: zodToJsonSchema(CreateSharedStepSchema),
    },
    {
      name: 'update_shared_step',
      description: 'Update an existing shared step',
      inputSchema: zodToJsonSchema(UpdateSharedStepSchema),
    },
    {
      name: 'link_test_case_to_jira',
      description: 'Link a test case to a Jira issue',
      inputSchema: zodToJsonSchema(LinkTestCaseToJiraSchema),
    },
    {
      name: 'get_test_cases_linked_to_jira',
      description: 'Get test cases linked to a specific Jira issue',
      inputSchema: zodToJsonSchema(GetTestCasesLinkedToJiraSchema),
    },
  ],
}));

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, (request) =>
  match(request.params as { name: string; arguments: unknown })
    .with({ name: 'list_projects' }, ({ arguments: args }) => {
      const { limit, offset } = ListProjectsSchema.parse(args);
      return listProjects(limit, offset);
    })
    .with({ name: 'get_project' }, ({ arguments: args }) => {
      const { code } = GetProjectSchema.parse(args);
      return getProject(code);
    })
    .with({ name: 'create_project' }, ({ arguments: args }) => {
      const parsedArgs = CreateProjectSchema.parse(args);
      return createProject(parsedArgs);
    })
    .with({ name: 'get_results' }, ({ arguments: args }) => {
      const parsedArgs = GetResultsSchema.parse(args);
      const filters =
        parsedArgs.status || parsedArgs.from || parsedArgs.to
          ? `status=${parsedArgs.status || ''}&from=${parsedArgs.from || ''}&to=${parsedArgs.to || ''}`
          : undefined;
      return getResults([
        parsedArgs.code,
        parsedArgs.limit,
        parsedArgs.offset,
        filters,
      ]);
    })
    .with({ name: 'get_result' }, ({ arguments: args }) => {
      const { code, hash } = GetResultSchema.parse(args);
      return getResult(code, hash);
    })
    .with({ name: 'create_result' }, ({ arguments: args }) => {
      const { code, id, result } = CreateResultSchema.parse(args);
      return createResult(code, id, result);
    })
    .with({ name: 'create_result_bulk' }, ({ arguments: args }) => {
      const { code, id, results } = CreateResultBulkSchema.parse(args);
      return createResultBulk(code, id, results);
    })
    .with({ name: 'update_result' }, ({ arguments: args }) => {
      const { code, id, hash, result } = UpdateResultSchema.parse(args);
      return updateResult(code, id, hash, result);
    })
    .with({ name: 'get_cases' }, ({ arguments: args }) => {
      const {
        code,
        search,
        milestoneId,
        suiteId,
        severity,
        priority,
        type,
        behavior,
        automation,
        status,
        externalIssuesType,
        externalIssuesIds,
        include,
        limit,
        offset,
      } = GetCasesSchema.parse(args);
      return getCases([
        code,
        search,
        milestoneId,
        suiteId,
        severity,
        priority,
        type,
        behavior,
        automation,
        status,
        externalIssuesType,
        externalIssuesIds,
        include,
        limit,
        offset,
      ]);
    })
    .with({ name: 'get_case' }, ({ arguments: args }) => {
      const { code, id } = GetCaseSchema.parse(args);
      return getCase(code, id);
    })
    .with({ name: 'create_case' }, ({ arguments: args }) => {
      const { code, testCase } = CreateCaseSchema.parse(args);
      return createCase(code, testCase);
    })
    .with({ name: 'update_case' }, ({ arguments: args }) => {
      const { code, id, ...caseData } = UpdateCaseSchema.parse(args);
      return updateCase(code, id, caseData);
    })
    .with({ name: 'get_runs' }, ({ arguments: args }) => {
      const {
        code,
        search,
        status,
        milestone,
        environment,
        fromStartTime,
        toStartTime,
        limit,
        offset,
        include,
      } = GetRunsSchema.parse(args);
      return getRuns([
        code,
        search,
        status,
        milestone,
        environment,
        fromStartTime,
        toStartTime,
        limit,
        offset,
        include,
      ]);
    })
    .with({ name: 'get_run' }, ({ arguments: args }) => {
      const { code, id, include } = GetRunSchema.parse(args);
      return getRun(code, id, include);
    })
    .with({ name: 'get_plans' }, ({ arguments: args }) => {
      const { code, limit, offset } = GetPlansSchema.parse(args);
      return getPlans(code, limit, offset);
    })
    .with({ name: 'get_plan' }, ({ arguments: args }) => {
      const { code, id } = GetPlanSchema.parse(args);
      return getPlan(code, id);
    })
    .with({ name: 'create_plan' }, ({ arguments: args }) => {
      const { code, ...planData } = CreatePlanSchema.parse(args);
      return createPlan(code, planData);
    })
    .with({ name: 'update_plan' }, ({ arguments: args }) => {
      const { code, id, ...planData } = UpdatePlanSchema.parse(args);
      return updatePlan(code, id, planData);
    })
    .with({ name: 'get_suites' }, ({ arguments: args }) => {
      const { code, search, limit, offset } = GetSuitesSchema.parse(args);
      return getSuites(code, search, limit, offset);
    })
    .with({ name: 'get_suite' }, ({ arguments: args }) => {
      const { code, id } = GetSuiteSchema.parse(args);
      return getSuite(code, id);
    })
    .with({ name: 'create_suite' }, ({ arguments: args }) => {
      const { code, ...suiteData } = CreateSuiteSchema.parse(args);
      return createSuite(code, suiteData);
    })
    .with({ name: 'update_suite' }, ({ arguments: args }) => {
      const { code, id, ...suiteData } = UpdateSuiteSchema.parse(args);
      return updateSuite(code, id, suiteData);
    })
    .with({ name: 'get_shared_steps' }, ({ arguments: args }) => {
      const { code, search, limit, offset } = GetSharedStepsSchema.parse(args);
      return getSharedSteps(code, search, limit, offset);
    })
    .with({ name: 'get_shared_step' }, ({ arguments: args }) => {
      const { code, hash } = GetSharedStepSchema.parse(args);
      return getSharedStep(code, hash);
    })
    .with({ name: 'create_shared_step' }, ({ arguments: args }) => {
      const { code, ...stepData } = CreateSharedStepSchema.parse(args);
      return createSharedStep(code, stepData);
    })
    .with({ name: 'update_shared_step' }, ({ arguments: args }) => {
      const { code, hash, stepData } = UpdateSharedStepSchema.parse(args);
      return updateSharedStep(code, hash, stepData);
    })
    .with({ name: 'link_test_case_to_jira' }, ({ arguments: args }) => {
      const { code, caseId, jiraIssueKey, jiraType } = LinkTestCaseToJiraSchema.parse(args);
      return linkTestCaseToJira(code, caseId, jiraIssueKey, jiraType);
    })
    .with({ name: 'get_test_cases_linked_to_jira' }, ({ arguments: args }) => {
      const { code, jiraIssueKey, jiraType, limit, offset } = GetTestCasesLinkedToJiraSchema.parse(args);
      return getTestCasesLinkedToJira(code, jiraIssueKey, jiraType, limit, offset);
    })
    .otherwise(() => errAsync('Unknown tool'))
    .map((response: any) => {
      // Handle both standard responses and our custom Jira responses
      const result = response.data && response.data.result !== undefined 
        ? response.data.result 
        : response.data;
      return result;
    })
    .map((data: any) => ({
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }))
    .match(
      (data: any) => data,
      (error: any) => {
        throw new Error(error);
      },
    ),
);

/**
 * Handler that lists available prompts.
 * Exposes a single "summarize_notes" prompt that summarizes all notes.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [],
}));

/**
 * Handler for the summarize_notes prompt.
 * Returns a prompt that requests summarization of all notes, with the notes' contents embedded as resources.
 */
server.setRequestHandler(GetPromptRequestSchema, async () => ({
  messages: [],
}));

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
