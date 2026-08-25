import { API_BASE_URL } from "./auth";

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiChatResponse = {
  reply: string;
  conversationId?: string;
};

export async function sendAiMessage(
  token: string,
  messages: AiMessage[],
): Promise<AiChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
    cache: "no-store",
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const body =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;

  if (!response.ok || body?.success === false) {
    const message =
      typeof body?.message === "string"
        ? body.message
        : `AI request failed (${response.status})`;

    throw new Error(message);
  }

  const data =
    body?.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : body;

  return {
    reply: String(data?.reply ?? data?.message ?? ""),
    conversationId:
      typeof data?.conversationId === "string"
        ? data.conversationId
        : undefined,
  };
}
