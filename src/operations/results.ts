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

export const GetFailedResultsSchema = z.object({
  code: z.string(),
  runId: z.number(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
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

export const getFailedResults = (
  code: string,
  runId: number,
  limit?: string,
  offset?: string,
  from?: string,
  to?: string,
) => {
  // Call the API with individual parameters
  // getResults(code, status, run, caseId, member, api, fromEndTime, toEndTime, limit, offset, options)
  return pipe(
    apply(client.results.getResults.bind(client.results)),
    (promise: any) => toResult(promise),
  )([
    code,          // code
    'failed',      // status
    runId.toString(),  // run
    undefined,     // caseId
    undefined,     // member
    undefined,     // api
    from,          // fromEndTime
    to,            // toEndTime
    limit ? parseInt(limit, 10) : undefined,         // limit
    offset ? parseInt(offset, 10) : undefined,        // offset
    undefined      // options
  ]);
};
