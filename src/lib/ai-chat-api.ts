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
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {}

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `AI request failed (${response.status})`);
  }

  const data = payload?.data ?? payload;
  return {
    reply: String(data?.reply ?? data?.message ?? ""),
    conversationId: data?.conversationId,
  };
}
