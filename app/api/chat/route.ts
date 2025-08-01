import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  // You can use body.messages if needed
  return NextResponse.json({
    response: "This is a mock AI response. Replace with your model integration.",
  });
}
