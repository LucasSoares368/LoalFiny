import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserPlan } from "@/hooks/useUserPlan";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_API_URL || "/api"}/functions/ai-chat`;

const suggestedQuestions = [
  "Faça um resumo financeiro do mês atual",
  "Qual meu saldo total em todas as contas?",
  "Quais são minhas maiores despesas este mês?",
  "Como estão minhas metas financeiras?",
  "Qual a situação das minhas dívidas?",
  "Compare receitas e despesas pessoal vs empresarial",
];

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { canUseAI, loading: planLoading } = useUserPlan();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(async (allMessages: Message[]) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok) {
      let errMsg = "Erro ao conectar com IA.";
      try {
        const errData = await resp.json();
        errMsg = errData.error || errMsg;
      } catch {
        // ignore json parse failures for error body
      }
      toast.error(errMsg);
      throw new Error(errMsg);
    }

    if (!resp.body) {
      throw new Error("No response body");
    }

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await resp.json();
      const content = payload?.data?.message || payload?.message || "Assistente IA ainda não configurado.";
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((message, index) =>
                  index === prev.length - 1
                    ? { ...message, content: assistantSoFar }
                    : message,
                );
              }

              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = `${line}\n${textBuffer}`;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;

        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((message, index) =>
                  index === prev.length - 1
                    ? { ...message, content: assistantSoFar }
                    : message,
                );
              }

              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          // ignore partial leftovers
        }
      }
    }
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    const userMsg: Message = { role: "user", content: msgText };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(updatedMessages);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, streamChat]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversa limpa");
  };

  const Header = () => (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
            Assistente IA
          </h1>
          <p className="mt-1 max-w-2xl text-lg text-muted-foreground">
            Converse com a LocalFiny para analisar finanças, metas, dívidas e movimentações.
          </p>
        </div>
      </div>

      {messages.length > 0 && (
        <Button variant="outline" className="h-12 rounded-2xl px-5 font-semibold" onClick={clearChat}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpar conversa
        </Button>
      )}
    </div>
  );

  if (!planLoading && !canUseAI()) {
    return (
      <AppLayout title="Assistente IA">
        <div className="mx-auto max-w-3xl space-y-8">
          <Header />
          <UpgradePrompt
            feature="Assistente IA"
            description="Tenha um assistente pessoal para analisar suas finanças, tirar dúvidas e dar dicas personalizadas baseadas nos seus dados reais."
            requiredPlan="pro"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Assistente IA">
      <div className="mx-auto flex h-[calc(100vh-5.5rem)] max-w-6xl flex-col gap-6">
        <Header />

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-border/80 bg-card shadow-sm">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-5 p-5 sm:p-6">
              {messages.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center space-y-7 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-10 w-10" />
                  </div>

                  <div>
                    <h2 className="mb-2 text-2xl font-bold text-foreground">
                      Assistente Financeiro IA
                    </h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">
                      Pergunte sobre suas finanças. O assistente usa seus dados reais de transações, bancos, dívidas e metas para responder.
                    </p>
                  </div>

                  <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                    {suggestedQuestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => handleSend(question)}
                        className="rounded-2xl border bg-background p-4 text-left text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bot className="h-5 w-5" />
                      </div>
                    )}

                    <Card
                      className={`max-w-[86%] rounded-2xl p-4 shadow-sm sm:max-w-[78%] ${
                        message.role === "user"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/80 bg-muted/50"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                      )}
                    </Card>

                    {message.role === "user" && (
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <Card className="rounded-2xl bg-muted/50 p-4 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>

          <div className="border-t bg-background/80 p-3 backdrop-blur sm:p-4">
            <div className="flex items-end gap-3 rounded-2xl border bg-card p-2 shadow-sm">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre suas finanças..."
                className="max-h-36 min-h-[48px] resize-none border-0 bg-transparent px-3 py-3 shadow-none focus-visible:ring-0"
                rows={1}
                disabled={isLoading}
              />

              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-12 w-12 shrink-0 rounded-2xl"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
