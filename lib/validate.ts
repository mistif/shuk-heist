import "server-only";
import * as z from "zod";
import { DEFAULT_DIFFICULTY, DIFFICULTY_IDS } from "./difficulty";
import { SUSPECT_IDS } from "./suspects";

export const USER_MESSAGE_MAX = 2000;
const ASSISTANT_MESSAGE_MAX = 8000;
export const MESSAGES_MAX = 100;

const Message = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(USER_MESSAGE_MAX) }),
  z.object({ role: z.literal("assistant"), content: z.string().min(1).max(ASSISTANT_MESSAGE_MAX) }),
]);

const CaseId = z.string().min(8).max(64);

export const ChatRequest = z.object({
  caseId: CaseId,
  messages: z
    .array(Message)
    .min(1)
    .max(MESSAGES_MAX)
    .refine((m) => m.at(-1)?.role === "user", "The last message must come from the player"),
  difficulty: z.enum(DIFFICULTY_IDS).default(DEFAULT_DIFFICULTY),
});

export const AccuseRequest = z.object({
  caseId: CaseId,
  suspect: z.enum(SUSPECT_IDS),
  final: z.boolean(),
});

export const SuspectReply = z.object({
  reply: z.string().describe("What you say out loud to the detective, in character"),
  nervousness: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe("How close the questioning is to your secret: 0 is relaxed, 10 is cornered"),
});

export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false };
  }
  const parsed = schema.safeParse(body);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false };
}

export function badRequest() {
  return Response.json({ error: "Invalid request" }, { status: 400 });
}

export function serverError(err: unknown) {
  console.error(err);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}
