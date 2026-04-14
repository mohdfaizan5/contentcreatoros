import { NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function POST(request: Request) {
  const { query } = await request.json();
  const results = await firecrawl.search(query, { limit: 5 });

  return NextResponse.json(results);
}