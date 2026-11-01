import { getSuspect, prepareSearch } from "@/lib/agents";
import { isSuspectId } from "@/lib/suspects";
import { badRequest, ChatRequest, parseBody, serverError, SuspectReply } from "@/lib/validate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSuspectId(id)) return Response.json({ error: "Unknown suspect" }, { status: 404 });

  const parsed = await parseBody(req, ChatRequest);
  if (!parsed.ok) return badRequest();

  try {
    await prepareSearch();
    const result = await getSuspect(id).invoke({ messages: parsed.data.messages });
    return Response.json(SuspectReply.parse(result.structuredResponse));
  } catch (err) {
    return serverError(err);
  }
}
