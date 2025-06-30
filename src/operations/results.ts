import {
  TestStepResultCreateStatusEnum,
  ResultCreate,
  ResultCreateBulk,
  ResultUpdate,
} from 'qaseio';
import { z } from 'zod';
import { toResult } from '../utils.js';
import { apply, pipe } from 'ramda';
import { client } from '../utils.js';

export const GetResultsSchema = z.object({
  code: z.string(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  status: z.nativeEnum(TestStepResultCreateStatusEnum).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const GetResultSchema = z.object({
  code: z.string(),
  hash: z.string(),
});

export const CreateResultSchema = z.object({
  code: z.string(),
  id: z.number(),
  result: z.record(z.any()).transform((v) => v as ResultCreate),
});

export const CreateResultBulkSchema = z.object({
  code: z.string(),
  id: z.number(),
  results: z.record(z.any()).transform((v) => v as ResultCreateBulk),
});

export const UpdateResultSchema = z.object({
  code: z.string(),
  id: z.number(),
  hash: z.string(),
  result: z.record(z.any()).transform((v) => v as ResultUpdate),
});

export const GetResultsByStatusSchema = z.object({
  code: z.string().describe('Project code'),
  runId: z.number().describe('Test run ID to get results for'),
  status: z
    .string()
    .describe(
      'Status to filter by (e.g., failed, passed, skipped, blocked, invalid)',
    ),
  unique: z
    .boolean()
    .optional()
    .describe(
      'Return only unique test cases (removes duplicates from retries/reruns)',
    ),
  limit: z.string().optional().describe('Maximum number of results to return'),
  offset: z
    .string()
    .optional()
    .describe('Number of results to skip for pagination'),
  from: z
    .string()
    .optional()
    .describe(
      'Filter results from this timestamp (format: YYYY-MM-DD HH:mm:ss)',
    ),
  to: z
    .string()
    .optional()
    .describe('Filter results to this timestamp (format: YYYY-MM-DD HH:mm:ss)'),
});

export const getResults = pipe(
  apply(client.results.getResults.bind(client.results)),
  (promise: any) => toResult(promise),
);

export const getResult = pipe(
  client.results.getResult.bind(client.results),
  (promise: any) => toResult(promise),
);

export const createResult = pipe(
  client.results.createResult.bind(client.results),
  (promise: any) => toResult(promise),
);

export const createResultBulk = pipe(
  client.results.createResultBulk.bind(client.results),
  (promise: any) => toResult(promise),
);

export const updateResult = pipe(
  client.results.updateResult.bind(client.results),
  (promise: any) => toResult(promise),
);

export const getResultsByStatus = (
  code: string,
  runId: number,
  status: string,
  unique?: boolean,
  limit?: string,
  offset?: string,
  from?: string,
  to?: string,
) => {
  // If unique filtering is requested, we need to get all results first (ignore limit/offset)
  // then apply unique filtering, then apply limit/offset to the filtered results
  const apiLimit = unique ? 100 : limit ? parseInt(limit, 10) : undefined; // Use high limit for unique filtering
  const apiOffset = unique ? 0 : offset ? parseInt(offset, 10) : undefined; // Start from beginning for unique

  // Call the API with individual parameters
  // getResults(code, status, run, caseId, member, api, fromEndTime, toEndTime, limit, offset, options)
  const apiCall = pipe(
    apply(client.results.getResults.bind(client.results)),
    (promise: any) => toResult(promise),
  )([
    code, // code
    status, // status (user-specified: failed, passed, skipped, etc.)
    runId.toString(), // run
    undefined, // caseId
    undefined, // member
    undefined, // api
    from, // fromEndTime
    to, // toEndTime
    apiLimit, // limit
    apiOffset, // offset
    undefined, // options
  ]);

  // If unique filtering is not requested, return the result as-is
  if (!unique) {
    return apiCall;
  }

  // Apply unique filtering using map on the result
  return apiCall.map((data: any) => {
    const entities = data.data?.result?.entities || [];

    // Filter to unique case IDs (keep the latest result for each case)
    const uniqueEntities = [];
    const seenCaseIds = new Set();

    // Process entities in reverse order to keep the latest result for each case
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (!seenCaseIds.has(entity.case_id)) {
        seenCaseIds.add(entity.case_id);
        uniqueEntities.unshift(entity); // Add to beginning to maintain original order
      }
    }

    // Apply limit and offset to unique results
    const startIndex = offset ? parseInt(offset, 10) : 0;
    const endIndex = limit ? startIndex + parseInt(limit, 10) : undefined;
    const paginatedEntities = uniqueEntities.slice(startIndex, endIndex);

    // Return the modified result
    return {
      ...data,
      data: {
        ...data.data,
        result: {
          ...data.data.result,
          entities: paginatedEntities,
          count: paginatedEntities.length,
          filtered: uniqueEntities.length, // Total unique results available
        },
      },
    };
  });
};
