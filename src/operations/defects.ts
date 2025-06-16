import { DefectCreate, DefectUpdate, DefectStatus } from 'qaseio';
import { z } from 'zod';
import { client, toResult } from '../utils.js';
import { apply, pipe } from 'ramda';
import { getResultsByStatus } from './results.js';
import { getCase } from './cases.js';
import { getRun } from './runs.js';

// Schema for getting all defects
export const GetDefectsSchema = z.object({
  code: z.string(),
  status: z.enum(['open', 'resolved', 'in_progress', 'invalid']).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

// Schema for getting a specific defect
export const GetDefectSchema = z.object({
  code: z.string(),
  id: z.number(),
});

// Schema for creating a new defect
export const CreateDefectSchema = z.object({
  code: z.string(),
  defect: z.object({
    title: z.string(),
    actual_result: z.string(),
    severity: z.number(),
    milestone_id: z.number().nullable().optional(),
    attachments: z.array(z.string()).optional(),
    custom_field: z.record(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).transform((v) => v as DefectCreate),
});

// Schema for updating a defect
export const UpdateDefectSchema = z.object({
  code: z.string(),
  id: z.number(),
  title: z.string().optional(),
  actual_result: z.string().optional(),
  severity: z.number().optional(),
  milestone_id: z.number().nullable().optional(),
  attachments: z.array(z.string()).optional(),
  custom_field: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Schema for deleting a defect
export const DeleteDefectSchema = z.object({
  code: z.string(),
  id: z.number(),
});

// Schema for resolving a defect
export const ResolveDefectSchema = z.object({
  code: z.string(),
  id: z.number(),
});

// Schema for updating defect status
export const UpdateDefectStatusSchema = z.object({
  code: z.string(),
  id: z.number(),
  status: z.enum(['in_progress', 'resolved', 'invalid']),
});

// Schema for updating defect with failed tests
export const UpdateDefectWithFailedTestsSchema = z.object({
  code: z.string().describe('Project code'),
  defectId: z.number().describe('ID of the defect to update'),
  runId: z.number().optional().describe('Specific test run ID to filter failed tests'),
  timeRange: z.object({
    from: z.string().describe('Start date (ISO format: YYYY-MM-DD HH:mm:ss)'),
    to: z.string().describe('End date (ISO format: YYYY-MM-DD HH:mm:ss)'),
  }).optional().describe('Date range to filter failed tests'),
  testCaseIds: z.array(z.number()).optional().describe('Specific test case IDs to include'),
  linkType: z.enum(['related', 'caused_by', 'blocks']).default('related').describe('Type of link to create'),
  appendToDescription: z.boolean().default(true).describe('Whether to append links to defect description'),
  includeFailureDetails: z.boolean().default(true).describe('Whether to include failure details in links'),
});

// Get all defects
export const getDefects = pipe(
  apply(client.defects.getDefects.bind(client.defects)),
  (promise: any) => toResult(promise),
);

// Get a specific defect
export const getDefect = pipe(
  client.defects.getDefect.bind(client.defects),
  (promise: any) => toResult(promise),
);

// Create a new defect
export const createDefect = pipe(
  client.defects.createDefect.bind(client.defects),
  (promise: any) => toResult(promise),
);

// Convert update data to match API expectations
const convertDefectUpdateData = (
  data: Omit<z.infer<typeof UpdateDefectSchema>, 'code' | 'id'>,
): DefectUpdate => ({
  title: data.title,
  actual_result: data.actual_result,
  severity: data.severity,
  milestone_id: data.milestone_id,
  attachments: data.attachments,
  custom_field: data.custom_field,
  tags: data.tags,
});

// Update a defect
export const updateDefect = pipe(
  (
    code: string,
    id: number,
    data: Omit<z.infer<typeof UpdateDefectSchema>, 'code' | 'id'>,
  ) => client.defects.updateDefect(code, id, convertDefectUpdateData(data)),
  (promise: any) => toResult(promise),
);

// Delete a defect
export const deleteDefect = pipe(
  client.defects.deleteDefect.bind(client.defects),
  (promise: any) => toResult(promise),
);

// Resolve a defect
export const resolveDefect = pipe(
  client.defects.resolveDefect.bind(client.defects),
  (promise: any) => toResult(promise),
);

// Update defect status
export const updateDefectStatus = pipe(
  (code: string, id: number, status: string) => {
    const defectStatus: DefectStatus = {
      status: status as any, // TypeScript enum casting
    };
    return client.defects.updateDefectStatus(code, id, defectStatus);
  },
  (promise: any) => toResult(promise),
);

// Helper function to format test link
const formatTestLink = (
  testResult: any,
  testCase: any,
  testRun: any,
  options: {
    linkType: string;
    includeFailureDetails: boolean;
  }
) => {
  const timestamp = new Date(testResult.time_ms || Date.now()).toISOString();
  const qaseUrl = `https://app.qase.io/project/${testResult.project_code}/test-run/${testRun.id}#case=${testCase.id}`;
  
  let linkContent = `- **Test Case ${testCase.id}:** [${testCase.title || 'Untitled Test Case'}](${qaseUrl})\n`;
  linkContent += `  - **Run:** ${testRun.title || `Test Run ${testRun.id}`}\n`;
  linkContent += `  - **Failed at:** ${timestamp}\n`;
  linkContent += `  - **Link Type:** ${options.linkType}\n`;
  linkContent += `  - **Status:** Failed\n`;
  
  if (options.includeFailureDetails && testResult.comment) {
    linkContent += `  - **Failure Details:** ${testResult.comment}\n`;
  }
  
  return linkContent;
};

// Helper function to generate failed tests section
const generateFailedTestsSection = (
  failedTests: any[],
  testCases: Map<number, any>,
  testRuns: Map<number, any>,
  options: {
    linkType: string;
    includeFailureDetails: boolean;
  }
) => {
  const timestamp = new Date().toISOString();
  let section = `\n\n## Failed Tests Linked on ${timestamp}\n\n`;
  
  // Group by test run
  const groupedByRun = new Map<number, any[]>();
  failedTests.forEach(test => {
    const runId = test.run_id;
    if (!groupedByRun.has(runId)) {
      groupedByRun.set(runId, []);
    }
    groupedByRun.get(runId)!.push(test);
  });
  
  // Generate content for each run
  groupedByRun.forEach((tests, runId) => {
    const testRun = testRuns.get(runId);
    section += `### Test Run: ${testRun?.title || `Test Run ${runId}`} (ID: ${runId})\n\n`;
    
    tests.forEach(test => {
      const testCase = testCases.get(test.case_id);
      if (testCase) {
        section += formatTestLink(test, testCase, testRun, options);
      }
    });
    
    section += '\n';
  });
  
  return section;
};

// Link defect to failed test results using the proper public API approach
export const updateDefectWithFailedTests = (
  code: string,
  defectId: number,
  options: z.infer<typeof UpdateDefectWithFailedTestsSchema>
) => {
  return toResult(
    (async () => {
      // 1. Verify defect exists
      const defectResult = await getDefect(code, defectId);
      if (defectResult.isErr()) {
        throw new Error(defectResult.error);
      }
      
      const currentDefect = defectResult.value.data.result;
      if (!currentDefect) {
        throw new Error(`Defect with ID ${defectId} not found in project ${code}`);
      }

      // 2. Fetch failed test results
      if (!options.runId) {
        throw new Error('Run ID is required. Please specify a specific test run to link failed tests from.');
      }

      const failedTestsResult = await getResultsByStatus(
        code,
        options.runId,
        'failed',
        true, // unique
        '100', // limit
        '0',   // offset
        options.timeRange?.from,
        options.timeRange?.to
      );

      if (failedTestsResult.isErr()) {
        throw new Error(`Failed to fetch test results: ${failedTestsResult.error}`);
      }

      let allFailedTests: any[] = failedTestsResult.value.data?.result?.entities || [];

      // 3. Filter by specific test case IDs if provided
      if (options.testCaseIds && options.testCaseIds.length > 0) {
        allFailedTests = allFailedTests.filter((test: any) => 
          options.testCaseIds!.includes(test.case_id)
        );
      }

      if (allFailedTests.length === 0) {
        return {
          data: {
            result: {
              error: false,
              message: 'No failed tests found matching the specified criteria.',
              data: {
                defect: currentDefect,
                linkedTestsCount: 0,
                operation: 'No changes made'
              }
            }
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {}
        } as any;
      }

      // 4. Update each test result to link it to the defect using the public API
      const linkedResults: any[] = [];
      const failedUpdates: any[] = [];

      for (const testResult of allFailedTests) {
        try {
          // Use the proper public API approach: Update the test result with defect=true
          // According to the documentation, we can also pass the defect ID
          const updateResult = await client.results.updateResult(
            code,
            options.runId,
            testResult.hash,
            {
              defect: true, // This marks the result as having a defect
              comment: testResult.comment ? 
                `${testResult.comment}\n\n--- Linked to defect #${defectId} ---` : 
                `Linked to defect #${defectId}`,
              // For some API clients, you might be able to specify the defect ID directly
              // But the 'defect: true' approach is documented as the standard way
            }
          );

          linkedResults.push({
            caseId: testResult.case_id,
            runId: testResult.run_id,
            hash: testResult.hash,
            status: testResult.status,
            linked: true,
            apiResponse: updateResult
          });

        } catch (error) {
          console.warn(`Failed to link test result ${testResult.hash} to defect:`, error);
          failedUpdates.push({
            caseId: testResult.case_id,
            hash: testResult.hash,
            error: (error as any).message
          });
        }
      }

      // 5. Return results with linking information
      return {
        data: {
          result: {
            error: false,
            message: `Successfully linked ${linkedResults.length} failed tests to defect ${defectId}${failedUpdates.length > 0 ? ` (${failedUpdates.length} failed)` : ''}`,
            data: {
              defect: currentDefect,
              linkedTestsCount: linkedResults.length,
              linkedTests: linkedResults,
              failedLinks: failedUpdates,
              operation: 'Linked test results to defect using public API (PATCH /result/{projectCode}/{runId}/{resultHash})',
              methodology: {
                approach: 'Update individual test results with defect=true',
                endpoint: `PATCH /result/${code}/{runId}/{resultHash}`,
                documentation: 'https://docs.qase.io/general/issues/defects',
                parameters_used: {
                  defect: true,
                  comment: 'Updated with defect reference'
                }
              }
            }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      } as any;
    })()
  );
};