import { API_BASE_URL } from "./auth";

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
  createdAt?: string;
};

export type AiConversation = {
  _id: string;
  title: string;
  messages: AiMessage[];
  messageCount: number;
  lastActivityAt: string;
  createdAt: string;
};

export type AiChatResponse = {
  conversationId: string;
  reply: string;
  blocked: boolean;
};

export async function sendAiMessage(
  token: string,
  message: string,
  conversationId?: string,
): Promise<AiChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      conversationId,
    }),
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
    const messageText =
      typeof body?.message === "string"
        ? body.message
        : `AI request failed (${response.status})`;

    throw new Error(messageText);
  }

  const data =
    body?.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : {};

  return {
    conversationId: String(data.conversationId ?? ""),
    reply: String(data.reply ?? data.message ?? ""),
    blocked: Boolean(data.blocked),
  };
}
