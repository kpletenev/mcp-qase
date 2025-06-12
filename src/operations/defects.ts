import { DefectCreate, DefectUpdate, DefectStatus } from 'qaseio';
import { z } from 'zod';
import { client, toResult } from '../utils.js';
import { apply, pipe } from 'ramda';

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