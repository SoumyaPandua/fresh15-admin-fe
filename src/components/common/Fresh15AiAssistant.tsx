"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { sendAiMessage, type AiMessage } from "@/lib/ai-chat-api";
import { toast } from "sonner";

export function Fresh15AiAssistant() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Fresh15 AI. I can help with Fresh15-related questions. Please don't share passwords, OTPs, tokens, or other secrets.",
    },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, open]);

  async function submit() {
    const text = input.trim();
    if (!text || sending) return;

    const authenticatedToken = token;

    if (!authenticatedToken) {
      toast.error("Please sign in to use Fresh15 AI.");
      return;
    }

    const nextMessages: AiMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const result = await sendAiMessage(
        authenticatedToken,
        nextMessages,
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.reply,
        },
      ]);
    } catch (error) {
      setMessages((current) => current.slice(0, -1));

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to reach Fresh15 AI.",
      );
    } finally {
      setSending(false);
    }
  }

  if (!token) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Open Fresh15 AI"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-[70] grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <span className="relative">
          <Bot className="h-6 w-6" />
          <Sparkles className="absolute -right-3 -top-3 h-3.5 w-3.5 animate-pulse" />
        </span>
      </button>

      {open && (
        <section
          aria-label="Fresh15 AI assistant"
          className="fixed bottom-20 right-5 z-[70] flex h-[min(620px,calc(100vh-110px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl"
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>

              <div>
                <div className="font-bold">Fresh15 AI</div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  Secure assistant
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close Fresh15 AI"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="flex gap-2 border-t p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about Fresh15..."
              maxLength={1000}
              disabled={sending}
              className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />

            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </section>
      )}
    </>
  );
}
