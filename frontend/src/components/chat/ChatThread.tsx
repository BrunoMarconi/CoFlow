"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 5000;
const NEAR_BOTTOM_THRESHOLD_PX = 120;
const MAX_TEXTAREA_HEIGHT_PX = 120;
// Ventana para considerar dos mensajes consecutivos del mismo
// remitente parte del mismo "grupo" visual (menos separación, una
// sola colita al final) — igual criterio que WhatsApp/Telegram.
const GROUP_WINDOW_MS = 3 * 60 * 1000;

export interface ChatThreadSender {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
}

export interface ChatThreadMessage {
  id: number | string;
  content: string;
  created_at: string;
  sender: ChatThreadSender;
}

export default function ChatThread<TMessage extends ChatThreadMessage>({
  threadKey,
  currentUserId,
  fetchMessages,
  sendMessage,
  showSenderName,
  placeholder,
  variant = "card",
}: {
  /** Identificador de la conversación (id de comunidad o de conexión).
   * Es la única dependencia real del polling: fetchMessages/sendMessage
   * se leen desde un ref para no reiniciar el intervalo en cada render. */
  threadKey: number | string;
  currentUserId: string;
  fetchMessages: (params: { limit: number }) => Promise<TMessage[]>;
  sendMessage: (content: string) => Promise<TMessage>;
  showSenderName: boolean;
  placeholder: string;
  variant?: "card" | "full";
}) {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newArrivals, setNewArrivals] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasScrolledInitially = useRef(false);
  const previousCountRef = useRef(0);
  const isNearBottomRef = useRef(true);

  const fetchMessagesRef = useRef(fetchMessages);
  const sendMessageRef = useRef(sendMessage);

  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function fetchPage(showSpinner: boolean) {
      if (showSpinner) setLoading(true);

      fetchMessagesRef
        .current({ limit: 100 })
        .then((data) => {
          if (!active) return;
          setMessages(data);
          setLoadError("");
        })
        .catch(() => {
          if (!active) return;
          setLoadError("No pudimos cargar los mensajes. Intenta de nuevo.");
        })
        .finally(() => {
          if (active && showSpinner) setLoading(false);
        });
    }

    function startPolling() {
      if (intervalId) return;

      intervalId = setInterval(() => {
        fetchPage(false);
      }, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchPage(false);
        startPolling();
      } else {
        stopPolling();
      }
    }

    hasScrolledInitially.current = false;
    previousCountRef.current = 0;

    fetchPage(true);

    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [threadKey]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || messages.length === 0) return;

    if (!hasScrolledInitially.current) {
      container.scrollTop = container.scrollHeight;
      hasScrolledInitially.current = true;
      previousCountRef.current = messages.length;
      return;
    }

    const grew = messages.length > previousCountRef.current;
    const arrivedCount = messages.length - previousCountRef.current;
    previousCountRef.current = messages.length;

    if (!grew) return;

    if (isNearBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    } else {
      setNewArrivals((current) => current + arrivedCount);
    }
  }, [messages]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX;

    isNearBottomRef.current = nearBottom;
    setIsNearBottom(nearBottom);

    if (nearBottom) {
      setNewArrivals(0);
    }
  }

  function scrollToRecent() {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });

    setNewArrivals(0);
  }

  function autoResizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      MAX_TEXTAREA_HEIGHT_PX
    )}px`;
  }

  async function submitMessage() {
    const trimmed = content.trim();

    if (!trimmed || sending) return;

    setSending(true);
    setSendError("");

    try {
      const message = await sendMessageRef.current(trimmed);

      setMessages((current) => [...current, message]);
      setContent("");

      requestAnimationFrame(autoResizeTextarea);
    } catch {
      setSendError("No pudimos enviar tu mensaje. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  const renderItems = useMemo(() => buildRenderItems(messages), [messages]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-surface shadow-soft",
        variant === "full"
          ? "h-full min-h-0 rounded-none border-0 sm:h-[min(72dvh,640px)] sm:min-h-[420px] sm:rounded-18 sm:border sm:border-border"
          : "h-[min(78dvh,640px)] min-h-[420px] rounded-18 border border-border sm:h-[min(72dvh,640px)]"
      )}
    >
      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="chat-wallpaper h-full overflow-y-auto p-4 sm:p-5"
        >
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          ) : loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-semibold text-red-600">
                {loadError}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
              <p className="text-sm font-semibold text-brand-dark">
                Todavía no hay mensajes.
              </p>
              <p className="text-sm text-muted">
                Escribe el primero para empezar la conversación.
              </p>
            </div>
          ) : (
            renderItems.map((item) =>
              item.type === "date" ? (
                <div
                  key={item.key}
                  className="sticky top-0 z-10 mb-3 flex justify-center first:mt-0 not-first:mt-4"
                >
                  <span className="rounded-full bg-surface/90 px-3 py-1 text-[11px] font-bold text-secondary shadow-soft backdrop-blur-sm">
                    {item.label}
                  </span>
                </div>
              ) : (
                <div
                  key={item.message.id}
                  className={item.firstOfGroup ? "mt-3 first:mt-0" : "mt-0.5"}
                >
                  <MessageBubble
                    message={item.message}
                    isOwn={item.message.sender.id === currentUserId}
                    showSenderName={showSenderName}
                    firstOfGroup={item.firstOfGroup}
                    lastOfGroup={item.lastOfGroup}
                  />
                </div>
              )
            )
          )}
        </div>

        {!isNearBottom && messages.length > 0 && (
          <button
            type="button"
            onClick={scrollToRecent}
            aria-label="Ir a los mensajes recientes"
            className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-brand-dark shadow-soft transition active:scale-95"
          >
            <DownArrowIcon />
            {newArrivals > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {newArrivals > 9 ? "9+" : newArrivals}
              </span>
            )}
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-border bg-surface p-3 pb-[max(0.75rem,var(--safe-bottom))] sm:gap-3 sm:p-4"
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            autoResizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={2000}
          disabled={sending}
          rows={1}
          className="max-h-30 min-h-11 min-w-0 flex-1 resize-none rounded-full border border-border bg-surface-muted px-4 py-2.5 text-base leading-6 text-foreground outline-none transition focus:border-primary disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={sending || !content.trim()}
          aria-label="Enviar mensaje"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <LoadingIcon /> : <SendIcon />}
        </button>
      </form>

      {sendError && (
        <p
          role="alert"
          className="border-t border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600"
        >
          {sendError}
        </p>
      )}
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showSenderName,
  firstOfGroup,
  lastOfGroup,
}: {
  message: ChatThreadMessage;
  isOwn: boolean;
  showSenderName: boolean;
  firstOfGroup: boolean;
  lastOfGroup: boolean;
}) {
  const [avatarError, setAvatarError] = useState(false);

  const fullName = [message.sender.first_name, message.sender.last_name]
    .filter(Boolean)
    .join(" ");

  const initials = [message.sender.first_name, message.sender.last_name]
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const time = formatMessageTime(message.created_at);

  // El avatar por mensaje solo tiene sentido en chats de grupo
  // (comunidad); en 1:1 no aporta nada que el encabezado del hilo no
  // muestre ya. Cuando sí aplica, solo se pinta en el último mensaje
  // del grupo — el resto reserva el mismo hueco para que las burbujas
  // seguidas queden alineadas.
  const showAvatarColumn = showSenderName && !isOwn;

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {showAvatarColumn &&
        (lastOfGroup ? (
          message.sender.avatar_url && !avatarError ? (
            <Image
              src={message.sender.avatar_url}
              alt={fullName}
              width={28}
              height={28}
              unoptimized
              onError={() => setAvatarError(true)}
              className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-white">
              {initials || "CF"}
            </div>
          )
        ) : (
          <div className="h-7 w-7 shrink-0" aria-hidden="true" />
        ))}

      <div
        className={cn(
          "max-w-[80%] min-w-0 rounded-18 px-3.5 py-2 shadow-[0_1px_1px_rgb(0_0_0/0.04)]",
          isOwn
            ? cn(
                "bg-primary text-white",
                lastOfGroup && "chat-tail-own rounded-br-md"
              )
            : cn(
                "bg-surface text-foreground",
                lastOfGroup && "chat-tail-other rounded-bl-md"
              )
        )}
      >
        {!isOwn && showSenderName && firstOfGroup && (
          <p className="truncate text-xs font-bold text-primary-dark">
            {fullName || "Miembro de CoFlow"}
          </p>
        )}

        <p className="whitespace-pre-line text-sm leading-6 wrap-anywhere">
          {message.content}
        </p>

        <p
          className={cn(
            "mt-0.5 text-right text-[10px] font-semibold",
            isOwn ? "text-white/70" : "text-muted"
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
});

function buildRenderItems<TMessage extends ChatThreadMessage>(
  messages: TMessage[]
): (
  | { type: "date"; key: string; label: string }
  | { type: "message"; message: TMessage; firstOfGroup: boolean; lastOfGroup: boolean }
)[] {
  type Item =
    | { type: "date"; key: string; label: string }
    | { type: "message"; message: TMessage; firstOfGroup: boolean; lastOfGroup: boolean };

  const items: Item[] = [];

  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const messageDate = new Date(message.created_at);
    const previousDate = previous ? new Date(previous.created_at) : null;

    const isNewDay = !previousDate || !isSameDay(messageDate, previousDate);

    if (isNewDay) {
      items.push({
        type: "date",
        key: `date-${message.id}`,
        label: formatDateSeparatorLabel(messageDate),
      });
    }

    const withinGroupWindow =
      previous &&
      !isNewDay &&
      previous.sender.id === message.sender.id &&
      messageDate.getTime() - new Date(previous.created_at).getTime() <
        GROUP_WINDOW_MS;

    items.push({
      type: "message",
      message,
      firstOfGroup: !withinGroupWindow,
      lastOfGroup: true, // se corrige abajo mirando el siguiente mensaje
    });
  });

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item.type !== "message") continue;

    const next = items[index + 1];
    item.lastOfGroup = !next || next.type === "date" || next.firstOfGroup;
  }

  return items;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateSeparatorLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Hoy";
  if (isSameDay(date, yesterday)) return "Ayer";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-muted border-t-primary" />
  );
}

function LoadingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function DownArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  );
}
