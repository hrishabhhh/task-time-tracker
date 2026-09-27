import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const timeLogIdSchema = z.string().uuid();

type TimeLogRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: TimeLogRouteContext,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const idResult = timeLogIdSchema.safeParse(id);

  if (!idResult.success) {
    return NextResponse.json({ error: "Invalid time log ID" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: timeLog, error: fetchError } = await supabase
    .from("time_logs")
    .select("id, ended_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to fetch time log:", fetchError);

    return NextResponse.json(
      { error: "Failed to delete time log" },
      { status: 500 },
    );
  }

  if (!timeLog) {
    return NextResponse.json({ error: "Time log not found" }, { status: 404 });
  }

  if (timeLog.ended_at === null) {
    return NextResponse.json(
      {
        error: "Stop the running timer before deleting this time log",
      },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("time_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete time log:", error);

    return NextResponse.json(
      { error: "Failed to delete time log" },
      { status: 500 },
    );
  }

  return new Response(null, {
    status: 204,
  });
}
