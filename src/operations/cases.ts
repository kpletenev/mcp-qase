import { TestCaseCreate } from 'qaseio';
import { z } from 'zod';
import { client, toResult } from '../utils.js';
import { apply, pipe } from 'ramda';

export const GetCasesSchema = z.object({
  code: z.string(),
  search: z.string().optional(),
  milestoneId: z.number().optional(),
  suiteId: z.number().optional(),
  severity: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  behavior: z.string().optional(),
  automation: z.string().optional(),
  status: z.string().optional(),
  externalIssuesType: z
    .enum([
      'asana',
      'azure-devops',
      'clickup-app',
      'github-app',
      'gitlab-app',
      'jira-cloud',
      'jira-server',
      'linear',
      'monday',
      'redmine-app',
      'trello-app',
      'youtrack-app',
    ])
    .optional(),
  externalIssuesIds: z.array(z.string()).optional(),
  include: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export const GetCaseSchema = z.object({
  code: z.string(),
  id: z.number(),
});

export const CreateCaseSchema = z.object({
  code: z.string(),
  testCase: z.object({
    title: z.string(),
    description: z.string().optional(),
    preconditions: z.string().optional(),
    postconditions: z.string().optional(),
    severity: z.number().optional(),
    priority: z.number().optional(),
    type: z.number().optional(),
    behavior: z.number().optional(),
    automation: z.number().optional(),
    status: z.number().optional(),
    suite_id: z.number().optional(),
    milestone_id: z.number().optional(),
    layer: z.number().optional(),
    is_flaky: z.boolean().optional().transform((val) => val === undefined ? undefined : val ? 1 : 0),
    params: z.record(z.array(z.string())).optional(),
    tags: z.array(z.string()).optional(),
    steps: z
      .array(
        z.object({
          action: z.string(),
          expected_result: z.string().optional(),
          data: z.string().optional(),
          shared_step_hash: z.string().optional(),
          shared_step_nested_hash: z.string().optional(),
        }),
      )
      .optional(),
    custom_fields: z
      .array(
        z.object({
          id: z.number(),
          value: z.string(),
        }),
      )
      .optional(),
  }),
});

export const UpdateCaseSchema = z.object({
  code: z.string(),
  id: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  postconditions: z.string().optional(),
  severity: z.number().optional(),
  priority: z.number().optional(),
  type: z.number().optional(),
  behavior: z.number().optional(),
  automation: z.number().optional(),
  status: z.number().optional(),
  suite_id: z.number().optional(),
  milestone_id: z.number().optional(),
  layer: z.number().optional(),
  is_flaky: z.boolean().optional(),
  params: z.record(z.array(z.string())).optional(),
  tags: z.array(z.string()).optional(),
  steps: z
    .array(
      z.object({
        action: z.string(),
        expected_result: z.string().optional(),
        data: z.string().optional(),
        position: z.number().optional(),
      }),
    )
    .optional(),
  custom_fields: z
    .array(
      z.object({
        id: z.number(),
        value: z.string(),
      }),
    )
    .optional(),
});

export const CreateCaseBulkSchema = z.object({
  code: z.string(),
  cases: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      preconditions: z.string().optional(),
      postconditions: z.string().optional(),
      severity: z.number().optional(),
      priority: z.number().optional(),
      type: z.number().optional(),
      behavior: z.number().optional(),
      automation: z.number().optional(),
      status: z.number().optional(),
      suite_id: z.number().optional(),
      milestone_id: z.number().optional(),
      layer: z.number().optional(),
      is_flaky: z.boolean().optional(),
      params: z
        .array(
          z.object({
            title: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
      tags: z.array(z.string()).optional(),
      steps: z
        .array(
          z.object({
            action: z.string(),
            expected_result: z.string().optional(),
            data: z.string().optional(),
            position: z.number().optional(),
          }),
        )
        .optional(),
      custom_fields: z
        .array(
          z.object({
            id: z.number(),
            value: z.string(),
          }),
        )
        .optional(),
    }),
  ),
});

export const getCases = pipe(
  apply(client.cases.getCases.bind(client.cases)),
  (promise: any) => toResult(promise),
);

export const getCase = pipe(
  client.cases.getCase.bind(client.cases),
  (promise: any) => toResult(promise),
);

export const createCase = pipe(
  client.cases.createCase.bind(client.cases),
  (promise: any) => toResult(promise),
);

const convertCaseData = (
  data: Omit<z.infer<typeof UpdateCaseSchema>, 'code' | 'id'>,
) => ({
  ...data,
  is_flaky: data.is_flaky === undefined ? undefined : data.is_flaky ? 1 : 0,
  // params are already in the correct object format, no conversion needed
});

const mergeParameters = (
  existingParams: any,
  newParams: Record<string, string[]> | undefined,
): any => {
  // If no new params provided, return existing params (preserve them)
  if (!newParams) {
    return existingParams;
  }
  
  // If no existing params, return new params
  if (!existingParams) {
    return newParams;
  }
  
  // Convert existing params to Record<string, string[]> format if needed
  const normalizedExisting = typeof existingParams === 'object' ? existingParams : {};
  
  // Merge existing and new parameters
  return {
    ...normalizedExisting,
    ...newParams,
  };
};

export const updateCase = (
  code: string,
  id: number,
  data: Omit<z.infer<typeof UpdateCaseSchema>, 'code' | 'id'>,
) => {
  // If params are provided in the update, we need to merge with existing params
  if (data.params) {
    // First, get the existing test case to retrieve current parameters
    return toResult(client.cases.getCase(code, id) as any)
      .andThen((existingCaseResult: any) => {
        const existingCase = existingCaseResult.data.result;
        
        // New params are already in the correct object format: {"paramName": ["value1", "value2"]}
        const newParams = data.params!;
        
        // Merge existing parameters with new ones
        const mergedParams = mergeParameters(existingCase?.params, newParams);
        
        // Convert the data with merged parameters
        const convertedData = {
          ...data,
          is_flaky: data.is_flaky === undefined ? undefined : data.is_flaky ? 1 : 0,
          params: mergedParams,
        };
        
        // Use type assertion to handle the axios type mismatch
        const updatePromise = client.cases.updateCase(code, id, convertedData);
        return toResult(updatePromise as any);
      });
  } else {
    // If no params in update, use the original conversion (preserves existing params)
    const updatePromise = client.cases.updateCase(code, id, convertCaseData(data));
    return toResult(updatePromise as any);
  }
};
