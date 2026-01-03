import { NextResponse } from "next/server";
import { getProjects } from "@/lib/opencode";

export async function GET() {
  const projects = getProjects();
  return NextResponse.json(projects);
}
