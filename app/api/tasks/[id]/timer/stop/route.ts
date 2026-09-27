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
      { error: "Failed to stop timer" },
      { status: 500 },
    );
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { data: activeLog, error: activeLogError } = await supabase
    .from("time_logs")
    .select("id, started_at")
    .eq("task_id", id)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  if (activeLogError) {
    console.error("Failed to fetch active timer:", activeLogError);

    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 },
    );
  }

  if (!activeLog) {
    return NextResponse.json(
      { error: "No active timer found for this task" },
      { status: 409 },
    );
  }

  const endedAt = new Date();

  const startedAt = new Date(activeLog.started_at);

  const durationSeconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
  );

  const { data: timeLog, error } = await supabase
    .from("time_logs")
    .update({
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", activeLog.id)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Failed to stop timer:", error);

    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 },
    );
  }

  if (!timeLog) {
    return NextResponse.json(
      { error: "Timer has already been stopped" },
      { status: 409 },
    );
  }

  return NextResponse.json({
    timeLog,
  });
}
