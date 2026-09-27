import { z } from "zod";

export const taskStatusSchema = z.enum(["pending", "in_progress", "completed"]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .nullable()
      .optional(),

    status: taskStatusSchema.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  );
