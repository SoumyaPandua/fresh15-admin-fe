import { apiRequest } from "@/lib/api-client";

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
};

export type AiChatResult = {
  conversationId: string;
  reply: string;
  blocked?: boolean;
};

export async function sendAiMessage(
  token: string,
  message: string,
  conversationId?: string,
) {
  return (
    await apiRequest<AiChatResult>(
      "/api/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          ...(conversationId ? { conversationId } : {}),
        }),
      },
      token,
    )
  ).data;
}

export async function listAiConversations(token: string) {
  return (
    await apiRequest<
      Array<{
        _id: string;
        title: string;
        messageCount: number;
        lastActivityAt: string;
        createdAt: string;
      }>
    >("/api/ai/conversations", {}, token)
  ).data;
}

export async function getAiConversation(token: string, id: string) {
  return (
    await apiRequest<{
      _id: string;
      title: string;
      messages: AiMessage[];
      messageCount: number;
      lastActivityAt: string;
      createdAt: string;
    }>(`/api/ai/conversations/${id}`, {}, token)
  ).data;
}
