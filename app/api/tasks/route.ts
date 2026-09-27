import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createTaskSchema } from "@/lib/validations/task";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch tasks:", error);

    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }

  return NextResponse.json({ tasks: data });
}

export async function POST(request: Request) {
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

  const result = createTaskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid task data",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: result.data.title,
      description: result.data.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create task:", error);

    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }

  return NextResponse.json({ task: data }, { status: 201 });
}
