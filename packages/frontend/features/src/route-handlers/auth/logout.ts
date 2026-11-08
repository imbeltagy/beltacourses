import { NO_STORE, endSession } from "../shared/session";

export async function POST(): Promise<Response> {
  await endSession();
  return new Response(null, { status: 204, headers: NO_STORE });
}
