import { z } from 'zod';
import { client, toResult } from '../utils.js';

/**
 * Schema for QQL (Qase Query Language) search parameters
 */
export const QQLSearchSchema = z.object({
  query: z.string().min(1).max(1000).describe('Expression in Qase Query Language'),
  limit: z.number().min(1).max(100).optional().default(10).describe('Number of entities in result set'),
  offset: z.number().min(0).max(100000).optional().default(0).describe('Number of entities to skip for pagination'),
});

/**
 * Perform QQL search across Qase entities
 * 
 * @param query - QQL expression string
 * @param limit - Maximum number of results to return (1-100)
 * @param offset - Number of results to skip for pagination (0-100000)
 * @returns Promise with search results
 * 
 * @example
 * // Search for open defects
 * qqlSearch('entity = "defect" and status = "open"', 10, 0)
 * 
 * @example
 * // Search for test cases with authentication in title
 * qqlSearch('entity = "case" and project = "DEMO" and title ~ "auth" order by id desc', 20, 0)
 * 
 * @example
 * // Search for failed test results in recent sprint
 * qqlSearch('entity = "result" and status = "failed" and timeSpent > 5000 and milestone ~ "Sprint 12"', 50, 0)
 */
export const qqlSearch = (query: string, limit: number = 10, offset: number = 0) =>
  toResult(client.search.search(query, limit, offset) as any);