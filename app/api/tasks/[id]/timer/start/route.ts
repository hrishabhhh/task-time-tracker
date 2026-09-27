import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const taskIdSchema = z.string().uuid();

type TimerRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: TimerRouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const idResult = taskIdSchema.safeParse(id);

  if (!idResult.success) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (taskError) {
    console.error("Failed to verify task:", taskError);

    return NextResponse.json(
      { error: "Failed to start timer" },
      { status: 500 },
    );
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { data: activeLog, error: activeLogError } = await supabase
    .from("time_logs")
    .select("id, task_id, started_at")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  if (activeLogError) {
    console.error("Failed to check active timer:", activeLogError);

    return NextResponse.json(
      { error: "Failed to start timer" },
      { status: 500 },
    );
  }

  if (activeLog) {
    const message =
      activeLog.task_id === id
        ? "Timer is already running for this task"
        : "Another timer is already running";

    return NextResponse.json(
      {
        error: message,
        activeLog,
      },
      { status: 409 },
    );
  }

  const { data: timeLog, error } = await supabase
    .from("time_logs")
    .insert({
      user_id: user.id,
      task_id: id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to start timer:", error);

    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A timer is already running" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to start timer" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      timeLog,
    },
    {
      status: 201,
    },
  );
}
