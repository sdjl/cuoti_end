import { NextResponse } from "next/server";
export async function GET(_request) {
  return new NextResponse("49fb284ea38e82fcf9554736679e2897", {
    status: 200,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
