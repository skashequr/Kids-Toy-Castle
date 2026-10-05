import { NextResponse } from "next/server";
import { registerCustomer } from "@/server/actions/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customer = await registerCustomer(body);
    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to register.",
      },
      { status: 400 }
    );
  }
}
