import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("time_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch time logs:", error);

    return NextResponse.json(
      { error: "Failed to fetch time logs" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    timeLogs: data,
  });
}
