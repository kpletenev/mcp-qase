import { z } from 'zod';
import { toResult } from '../utils.js';
import { client } from '../utils.js';
import { ResultAsync } from 'neverthrow';

// Schema for getting failed results from a specific project
export const GetFailedResultsSchema = z.object({
  code: z.string().describe('Project code'),
  runId: z
    .string()
    .or(z.number())
    .optional()
    .describe('Specific run ID to filter by'),
  limit: z
    .string()
    .or(z.number())
    .optional()
    .describe('Number of results to return (1-100)'),
  offset: z
    .string()
    .or(z.number())
    .optional()
    .describe('Number of results to skip'),
  fromEndTime: z
    .string()
    .optional()
    .describe('From end time in format Y-m-d H:i:s'),
  toEndTime: z
    .string()
    .optional()
    .describe('To end time in format Y-m-d H:i:s'),
});

// Schema for getting detailed failed results with test case information
export const GetFailedResultsDetailedSchema = z.object({
  code: z.string().describe('Project code'),
  runId: z
    .string()
    .or(z.number())
    .optional()
    .describe('Specific run ID to filter by'),
  limit: z
    .string()
    .or(z.number())
    .optional()
    .describe('Number of results to return (1-100)'),
  offset: z
    .string()
    .or(z.number())
    .optional()
    .describe('Number of results to skip'),
  fromEndTime: z
    .string()
    .optional()
    .describe('From end time in format Y-m-d H:i:s'),
  toEndTime: z
    .string()
    .optional()
    .describe('To end time in format Y-m-d H:i:s'),
  includeSteps: z
    .boolean()
    .optional()
    .describe('Include step details in the results'),
  includeAttachments: z
    .boolean()
    .optional()
    .describe('Include attachment details'),
});

// Schema for analyzing failures in a specific run
export const AnalyzeRunFailuresSchema = z.object({
  code: z.string().describe('Project code'),
  runId: z.string().or(z.number()).describe('Run ID to analyze'),
  includeStacktraces: z
    .boolean()
    .optional()
    .describe('Include stacktrace details'),
  categorizeFailures: z
    .boolean()
    .optional()
    .describe('Categorize failures by type'),
});

/**
 * Get failed test results from a project
 */
export const getFailedResults = (
  args: z.infer<typeof GetFailedResultsSchema>,
) => {
  const { code, runId, limit, offset, fromEndTime, toEndTime } = args;

  // Build filters for failed results only
  const filters: string[] = ['status=failed'];

  if (runId) {
    filters.push(`run=${runId}`);
  }

  if (fromEndTime) {
    filters.push(`from_end_time=${fromEndTime}`);
  }

  if (toEndTime) {
    filters.push(`to_end_time=${toEndTime}`);
  }

  const filterString = filters.join('&');

  return toResult(
    client.results.getResults(
      code,
      limit ? String(limit) : '50',
      offset ? String(offset) : '0',
      filterString,
    ) as any,
  ).map((response: any) => {
    // Process the response to filter and enhance failed results
    const entities = response.data.result?.entities || [];
    const failedResults = entities
      .filter((entity: any) => entity.status === 'failed')
      .map((entity: any) => ({
        hash: entity.hash,
        runId: entity.run_id,
        caseId: entity.case_id,
        status: entity.status,
        comment: entity.comment,
        stacktrace: entity.stacktrace,
        timeSpentMs: entity.time_spent_ms,
        endTime: entity.end_time,
        attachments:
          entity.attachments?.map((att: any) => ({
            filename: att.filename,
            size: att.size,
            mime: att.mime,
            url: att.url,
          })) || [],
        failedSteps:
          entity.steps
            ?.filter((step: any) => step.status === 2)
            .map((step: any) => ({
              position: step.position,
              status: step.status,
              attachments: step.attachments || [],
            })) || [],
      }));

    return {
      ...response,
      data: {
        ...response.data,
        result: {
          total: response.data.result?.total || 0,
          filtered: response.data.result?.filtered || 0,
          count: failedResults.length,
          failedResults: failedResults,
        },
      },
    };
  });
};

/**
 * Get detailed failed test results with test case information
 */
export const getFailedResultsDetailed = (
  args: z.infer<typeof GetFailedResultsDetailedSchema>,
) => {
  const {
    code,
    runId,
    limit,
    offset,
    fromEndTime,
    toEndTime,
    includeSteps,
  } = args;

  // First get the failed results
  return getFailedResults({
    code,
    runId,
    limit,
    offset,
    fromEndTime,
    toEndTime,
  }).andThen((failedResponse: any) => {
    // Extract failed results from the response
    const failedResults = failedResponse.data.result?.failedResults || [];

    // Get test case details for each failed result
    const caseDetailsPromises = failedResults.map(async (result: any) => {
      try {
        // Get test case details
        const testCaseResponse = await client.cases.getCase(
          code,
          result.caseId,
        );
        const testCase = testCaseResponse.data.result;

        return {
          ...result,
          testCase: {
            id: testCase?.id,
            title: testCase?.title,
            description: testCase?.description,
            suite: testCase?.suite_id
              ? {
                  id: testCase.suite_id,
                  title: 'Suite information not available',
                }
              : null,
            severity: testCase?.severity,
            priority: testCase?.priority,
            type: testCase?.type,
            behavior: testCase?.behavior,
            automation: testCase?.automation,
            steps: includeSteps ? testCase?.steps : undefined,
          },
        };
      } catch {
        // If we can't get case details, still return the result
        return {
          ...result,
          testCase: {
            id: result.caseId,
            title: 'Unable to fetch test case details',
            description: null,
            error: 'Failed to retrieve test case information',
          },
        };
      }
    });

    return ResultAsync.fromPromise(
      Promise.all(caseDetailsPromises),
      (error: any) => `Failed to get detailed results: ${error.message}`,
    ).map((detailedResults) => ({
      ...failedResponse,
      data: {
        ...failedResponse.data,
        result: {
          total: failedResponse.data.result?.total || 0,
          filtered: failedResponse.data.result?.filtered || 0,
          count: detailedResults.length,
          failedResultsDetailed: detailedResults,
        },
      },
    }));
  });
};

/**
 * Analyze failures in a specific test run
 */
export const analyzeRunFailures = (
  args: z.infer<typeof AnalyzeRunFailuresSchema>,
) => {
  const { code, runId, includeStacktraces, categorizeFailures } = args;

  // Get all results for the specific run with filter
  const filterString = `run=${runId}`;

  return toResult(
    client.results.getResults(
      code,
      '100', // Get more results for analysis
      '0',
      filterString,
    ) as any,
  ).map((response: any) => {
    const allResults = response.data.result?.entities || [];
    const failedResults = allResults.filter(
      (entity: any) => entity.status === 'failed',
    );
    const passedResults = allResults.filter(
      (entity: any) => entity.status === 'passed',
    );
    const skippedResults = allResults.filter(
      (entity: any) => entity.status === 'skipped',
    );
    const blockedResults = allResults.filter(
      (entity: any) => entity.status === 'blocked',
    );

    // Basic statistics
    const stats = {
      total: allResults.length,
      passed: passedResults.length,
      failed: failedResults.length,
      skipped: skippedResults.length,
      blocked: blockedResults.length,
      passRate:
        allResults.length > 0
          ? ((passedResults.length / allResults.length) * 100).toFixed(2)
          : '0.00',
    };

    // Analyze failure patterns if requested
    let failureCategories: any = {};
    if (categorizeFailures) {
      failureCategories = failedResults.reduce(
        (categories: any, result: any) => {
          // Categorize by stacktrace patterns
          if (result.stacktrace) {
            const stacktrace = result.stacktrace.toLowerCase();
            if (
              stacktrace.includes('assertion') ||
              stacktrace.includes('assert')
            ) {
              categories.assertionErrors =
                (categories.assertionErrors || 0) + 1;
            } else if (stacktrace.includes('timeout')) {
              categories.timeoutErrors = (categories.timeoutErrors || 0) + 1;
            } else if (
              stacktrace.includes('connection') ||
              stacktrace.includes('network')
            ) {
              categories.networkErrors = (categories.networkErrors || 0) + 1;
            } else if (
              stacktrace.includes('null') ||
              stacktrace.includes('undefined')
            ) {
              categories.nullPointerErrors =
                (categories.nullPointerErrors || 0) + 1;
            } else {
              categories.otherErrors = (categories.otherErrors || 0) + 1;
            }
          } else {
            categories.noStacktraceErrors =
              (categories.noStacktraceErrors || 0) + 1;
          }
          return categories;
        },
        {},
      );
    }

    // Get detailed failure information
    const detailedFailures = failedResults.map((result: any) => ({
      hash: result.hash,
      caseId: result.case_id,
      comment: result.comment,
      stacktrace: includeStacktraces
        ? result.stacktrace
        : result.stacktrace
          ? 'Available'
          : 'Not available',
      timeSpentMs: result.time_spent_ms,
      endTime: result.end_time,
      hasAttachments: result.attachments && result.attachments.length > 0,
      failedStepsCount:
        result.steps?.filter((step: any) => step.status === 2).length || 0,
    }));

    return {
      ...response,
      data: {
        ...response.data,
        result: {
          runId: Number(runId),
          statistics: stats,
          failureCategories: categorizeFailures ? failureCategories : undefined,
          failures: detailedFailures,
          analysisTimestamp: new Date().toISOString(),
        },
      },
    };
  });
};
