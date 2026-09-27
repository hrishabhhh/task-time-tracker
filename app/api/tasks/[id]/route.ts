import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateTaskSchema } from "@/lib/validations/task";
import { z } from "zod";

type TaskRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: TaskRouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const taskIdSchema = z.string().uuid();
  const { id } = await params;
  const idResult = taskIdSchema.safeParse(id);

  if (!idResult.success) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch task:", error);

    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task: data });
}

export async function PATCH(request: Request, { params }: TaskRouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = updateTaskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid task data",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { id } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...result.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Failed to update task:", error);

    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(_request: Request, { params }: TaskRouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete task:", error);

    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return new Response(null, {
    status: 204,
  });
}
