"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CHAT_MESSAGES_CHANGED_EVENT,
  type ChatMessageChangedDetail,
} from "@/lib/chatEvents";
import { MOTION_SPRING } from "@/lib/motionTokens";

const POLL_INTERVAL_MS = 3500;
const PAGE_SIZE = 100;
const NEAR_BOTTOM_THRESHOLD_PX = 140;
const MAX_TEXTAREA_HEIGHT_PX = 120;
const GROUP_WINDOW_MS = 3 * 60 * 1000;
const DRAFT_PREFIX = "coflow:chat-draft:";
const OUTBOX_PREFIX = "coflow:chat-outbox:";

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

interface PendingMessage {
  id: string;
  content: string;
  createdAt: string;
  status: "sending" | "failed";
}

export default function ChatThread<TMessage extends ChatThreadMessage>({
  threadKey,
  currentUserId,
  fetchMessages,
  sendMessage,
  showSenderName,
  placeholder,
  variant = "card",
  onMessagesReceived,
}: {
  threadKey: number | string;
  currentUserId: string;
  fetchMessages: (params: { limit: number; skip?: number }) => Promise<TMessage[]>;
  sendMessage: (content: string) => Promise<TMessage>;
  showSenderName: boolean;
  placeholder: string;
  variant?: "card" | "full";
  onMessagesReceived?: () => void;
}) {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [content, setContent] = useState("");
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newArrivals, setNewArrivals] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fetchMessagesRef = useRef(fetchMessages);
  const sendMessageRef = useRef(sendMessage);
  const onMessagesReceivedRef = useRef(onMessagesReceived);
  const messagesRef = useRef<TMessage[]>([]);
  const seenMessageIdsRef = useRef(new Set<number | string>());
  const isNearBottomRef = useRef(true);
  const requestInFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const draftKey = `${DRAFT_PREFIX}${threadKey}`;
  const outboxKey = `${OUTBOX_PREFIX}${threadKey}`;

  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    onMessagesReceivedRef.current = onMessagesReceived;
  }, [onMessagesReceived]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const updateConnectionState = () => setIsOnline(navigator.onLine);
    updateConnectionState();
    window.addEventListener("online", updateConnectionState);
    window.addEventListener("offline", updateConnectionState);
    return () => {
      window.removeEventListener("online", updateConnectionState);
      window.removeEventListener("offline", updateConnectionState);
    };
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        setContent(window.localStorage.getItem(draftKey) ?? "");
      } catch {
        setContent("");
      }
      requestAnimationFrame(resizeTextarea);
    });
    return () => {
      active = false;
    };
  }, [draftKey]);

  useEffect(() => {
    try {
      if (content) window.localStorage.setItem(draftKey, content);
      else window.localStorage.removeItem(draftKey);
    } catch {
      // El chat sigue funcionando si el navegador bloquea localStorage.
    }
  }, [content, draftKey]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = window.localStorage.getItem(outboxKey);
        if (!saved) return;
        const parsed = JSON.parse(saved) as PendingMessage[];
        setPendingMessages(
          parsed.map((message) => ({ ...message, status: "failed" }))
        );
      } catch {
        window.localStorage.removeItem(outboxKey);
      }
    });
    return () => {
      active = false;
    };
  }, [outboxKey]);

  useEffect(() => {
    try {
      if (pendingMessages.length > 0) {
        window.localStorage.setItem(outboxKey, JSON.stringify(pendingMessages));
      } else {
        window.localStorage.removeItem(outboxKey);
      }
    } catch {
      // El mensaje sigue visible aunque el navegador bloquee el almacenamiento.
    }
  }, [outboxKey, pendingMessages]);

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function fetchLatest(showSpinner: boolean) {
      if (requestInFlightRef.current) return;
      requestInFlightRef.current = true;
      if (showSpinner) setLoading(true);

      try {
        const data = await fetchMessagesRef.current({ limit: PAGE_SIZE });
        if (!active) return;

        const isInitialLoad = !hasLoadedRef.current;
        const newMessages = isInitialLoad
          ? []
          : data.filter((message) => !seenMessageIdsRef.current.has(message.id));

        data.forEach((message) => seenMessageIdsRef.current.add(message.id));
        hasLoadedRef.current = true;
        setMessages((current) => mergeMessages(current, data));
        setHasOlder(data.length === PAGE_SIZE);
        setLoadError("");

        if (newMessages.length > 0) {
          onMessagesReceivedRef.current?.();
        }

        requestAnimationFrame(() => {
          if (isInitialLoad) {
            scrollToBottom("auto");
          } else if (newMessages.length > 0 && isNearBottomRef.current) {
            scrollToBottom("smooth");
          } else if (newMessages.length > 0) {
            setNewArrivals((current) => current + newMessages.length);
          }
        });
      } catch {
        if (active) {
          setLoadError("No hemos podido actualizar la conversación.");
        }
      } finally {
        requestInFlightRef.current = false;
        if (active && showSpinner) setLoading(false);
      }
    }

    function startPolling() {
      if (intervalId || !navigator.onLine) return;
      intervalId = setInterval(() => void fetchLatest(false), POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    }

    function refreshInForeground() {
      if (document.visibilityState !== "visible") return;
      void fetchLatest(false);
      startPolling();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshInForeground();
      else stopPolling();
    }

    void fetchLatest(true);
    if (document.visibilityState === "visible") startPolling();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refreshInForeground);
    window.addEventListener("online", refreshInForeground);

    return () => {
      active = false;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", refreshInForeground);
      window.removeEventListener("online", refreshInForeground);
    };
  }, [threadKey]);

  async function loadOlderMessages() {
    if (loadingOlder || !hasOlder) return;
    const container = containerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    setLoadingOlder(true);

    try {
      const data = await fetchMessagesRef.current({
        limit: PAGE_SIZE,
        skip: messagesRef.current.length,
      });
      data.forEach((message) => seenMessageIdsRef.current.add(message.id));
      setMessages((current) => mergeMessages(current, data));
      setHasOlder(data.length === PAGE_SIZE);
      setLoadError("");

      requestAnimationFrame(() => {
        if (!container) return;
        container.scrollTop = container.scrollHeight - previousHeight;
      });
    } catch {
      setLoadError("No hemos podido cargar los mensajes anteriores.");
    } finally {
      setLoadingOlder(false);
    }
  }

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX;
    isNearBottomRef.current = nearBottom;
    setIsNearBottom(nearBottom);
    if (nearBottom) setNewArrivals(0);
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
    setNewArrivals(0);
  }

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      MAX_TEXTAREA_HEIGHT_PX
    )}px`;
  }

  async function deliverMessage(pending: PendingMessage) {
    setPendingMessages((current) =>
      current.map((message) =>
        message.id === pending.id ? { ...message, status: "sending" } : message
      )
    );

    try {
      const delivered = await sendMessageRef.current(pending.content);
      seenMessageIdsRef.current.add(delivered.id);
      setMessages((current) => mergeMessages(current, [delivered]));
      setPendingMessages((current) =>
        current.filter((message) => message.id !== pending.id)
      );
      window.dispatchEvent(
        new CustomEvent<ChatMessageChangedDetail>(
          CHAT_MESSAGES_CHANGED_EVENT,
          {
            detail: {
              threadKey: String(threadKey),
              message: delivered,
            },
          }
        )
      );
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom("auto"));
      }
    } catch {
      setPendingMessages((current) =>
        current.map((message) =>
          message.id === pending.id ? { ...message, status: "failed" } : message
        )
      );
    }
  }

  function submitMessage() {
    const trimmed = content.trim();
    if (!trimmed) return;

    const optimisticMessage: PendingMessage = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setPendingMessages((current) => [...current, optimisticMessage]);
    setContent("");
    requestAnimationFrame(() => {
      resizeTextarea();
      scrollToBottom("smooth");
    });
    void deliverMessage(optimisticMessage);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submitMessage();
    }
  }

  const renderItems = useMemo(() => buildRenderItems(messages), [messages]);
  const showEmpty = messages.length === 0 && pendingMessages.length === 0;

  return (
    <MotionConfig reducedMotion="user">
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-surface",
        variant === "full"
          ? "h-full min-h-0 rounded-none border-0 sm:h-[min(74dvh,680px)] sm:min-h-[440px] sm:rounded-24 sm:border sm:border-border sm:shadow-soft"
          : "h-[min(78dvh,680px)] min-h-[420px] rounded-24 border border-border shadow-soft sm:h-[min(74dvh,680px)]"
      )}
    >
      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="chat-wallpaper h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5"
        >
          {hasOlder && !loading && (
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => void loadOlderMessages()}
                disabled={loadingOlder}
                className="min-h-11 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-secondary shadow-soft transition hover:border-foreground/30 hover:text-foreground disabled:opacity-60 sm:min-h-9"
              >
                {loadingOlder ? "Cargando…" : "Ver mensajes anteriores"}
              </button>
            </div>
          )}

          {loading ? (
            <MessageSkeleton />
          ) : showEmpty ? (
            <ConversationWelcome />
          ) : (
            <AnimatePresence initial={false}>
              {renderItems.map((item) =>
                item.type === "date" ? (
                  <div
                    key={item.key}
                    className="sticky top-0 z-10 mb-3 flex justify-center first:mt-0 not-first:mt-4"
                  >
                    <span className="rounded-full border border-border/70 bg-surface/90 px-3 py-1 text-[11px] font-semibold text-secondary shadow-soft backdrop-blur-md">
                      {item.label}
                    </span>
                  </div>
                ) : (
                  <motion.div
                    key={item.message.id}
                    layout="position"
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={MOTION_SPRING.snappy}
                    className={item.firstOfGroup ? "mt-3 first:mt-0" : "mt-0.5"}
                  >
                    <MessageBubble
                      message={item.message}
                      isOwn={item.message.sender.id === currentUserId}
                      showSenderName={showSenderName}
                      firstOfGroup={item.firstOfGroup}
                      lastOfGroup={item.lastOfGroup}
                    />
                  </motion.div>
                )
              )}

              {pendingMessages.map((message) => (
                <motion.div
                  key={message.id}
                  layout="position"
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={MOTION_SPRING.snappy}
                  className="mt-3"
                >
                  <PendingMessageBubble
                    message={message}
                    onRetry={() => void deliverMessage(message)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {loadError && !loading && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("online"))}
            className="absolute left-1/2 top-3 z-20 min-h-10 -translate-x-1/2 rounded-full border border-red-200 bg-surface px-4 text-xs font-semibold text-red-600 shadow-soft"
          >
            {loadError} Reintentar
          </button>
        )}

        <AnimatePresence>
          {!isNearBottom && !showEmpty && (
            <motion.button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              aria-label="Ir a los mensajes recientes"
              initial={{ opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: 8 }}
              transition={MOTION_SPRING.snappy}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "absolute bottom-3 right-3 flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 shadow-button transition-colors",
                newArrivals > 0
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "border border-border bg-surface text-foreground hover:border-foreground/20"
              )}
            >
              <DownArrowIcon />
              {newArrivals > 0 && (
                <span className="text-xs font-bold">
                  {newArrivals > 9 ? "9+ nuevos" : `${newArrivals} nuevo${newArrivals === 1 ? "" : "s"}`}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {!isOnline && (
        <div className="border-t border-border bg-surface px-4 py-2 text-center text-xs font-semibold text-secondary">
          Sin conexión. Puedes seguir escribiendo y reintentar al volver.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-surface px-3 pb-[max(0.75rem,var(--safe-bottom))] pt-3 sm:px-4 sm:pb-4"
      >
        <div className="flex items-end gap-2 rounded-24 border border-border bg-surface-soft px-2 py-2 shadow-[inset_0_1px_2px_rgb(0_0_0/0.03)] transition-all duration-200 focus-within:border-primary/50 focus-within:bg-surface focus-within:shadow-[0_2px_12px_-2px_rgb(0_0_0/0.08)] focus-within:ring-4 focus-within:ring-primary/10">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              resizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Mensaje"
            maxLength={2000}
            rows={1}
            className="max-h-30 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-6 text-foreground outline-none placeholder:text-muted"
          />

          <motion.button
            type="submit"
            disabled={!content.trim()}
            aria-label="Enviar mensaje"
            whileTap={content.trim() ? { scale: 0.9 } : undefined}
            transition={MOTION_SPRING.snappy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-button transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-border disabled:text-muted disabled:shadow-none"
          >
            <SendIcon />
          </motion.button>
        </div>

        <div className="mt-1.5 flex min-h-4 items-center justify-between px-2">
          <p className="hidden text-[10px] text-muted sm:block">
            Enter para enviar · Mayús + Enter para una nueva línea
          </p>
          {content.length > 1800 && (
            <p className="ml-auto text-[10px] font-semibold text-secondary">
              {content.length}/2000
            </p>
          )}
        </div>
      </form>
    </div>
    </MotionConfig>
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
  const showAvatarColumn = showSenderName && !isOwn;

  return (
    <div className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
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
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {initials || "CF"}
            </div>
          )
        ) : (
          <div className="h-7 w-7 shrink-0" aria-hidden="true" />
        ))}

      <div
        className={cn(
          "max-w-[84%] min-w-0 rounded-18 px-3.5 py-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)] sm:max-w-[72%]",
          isOwn
            ? cn(
                "bg-primary text-white",
                lastOfGroup && "chat-tail-own rounded-br-md",
                !firstOfGroup && "rounded-tr-md"
              )
            : cn(
                "border border-border bg-surface text-foreground",
                lastOfGroup && "chat-tail-other rounded-bl-md",
                !firstOfGroup && "rounded-tl-md"
              )
        )}
      >
        {!isOwn && showSenderName && firstOfGroup && (
          <p className="truncate text-xs font-bold text-primary-dark">
            {fullName || "Miembro de CoFlow"}
          </p>
        )}
        <p className="whitespace-pre-wrap text-[15px] leading-6 wrap-anywhere">
          {message.content}
        </p>
        <p className={cn("mt-0.5 text-right text-[10px] font-medium", isOwn ? "text-white/65" : "text-muted")}>
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  );
});

function PendingMessageBubble({
  message,
  onRetry,
}: {
  message: PendingMessage;
  onRetry: () => void;
}) {
  return (
    <div className="mt-3 flex flex-row-reverse items-end">
      <div
        className={cn(
          "chat-tail-own max-w-[84%] rounded-18 rounded-br-md bg-primary px-3.5 py-2 text-white shadow-soft sm:max-w-[72%]",
          message.status === "sending" && "opacity-80"
        )}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-6 wrap-anywhere">
          {message.content}
        </p>
        <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[10px] font-medium text-white/65">
          <span>{formatMessageTime(message.createdAt)}</span>
          {message.status === "sending" ? (
            <span>Enviando…</span>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-6 rounded-full border border-white/30 px-2 font-bold text-white"
            >
              No enviado · Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationWelcome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex h-full min-h-60 flex-col items-center justify-center px-8 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/8 text-primary-dark">
        <ConversationIcon />
      </div>
      <p className="mt-4 text-base font-bold text-foreground">Empieza con naturalidad</p>
      <p className="mt-1 max-w-xs text-sm leading-6 text-secondary">
        Un saludo breve es suficiente. Este espacio es privado para vosotros.
      </p>
    </motion.div>
  );
}

function MessageSkeleton() {
  return (
    <div className="skeleton-shimmer flex h-full flex-col justify-end gap-3 py-2" aria-label="Cargando mensajes">
      <div className="h-11 w-2/5 self-start rounded-18 rounded-bl-md bg-surface" />
      <div className="h-16 w-3/5 self-start rounded-18 bg-surface" />
      <div className="h-11 w-3/5 self-end rounded-18 rounded-br-md bg-primary/15" />
      <div className="h-12 w-2/5 self-end rounded-18 bg-primary/15" />
    </div>
  );
}

function mergeMessages<TMessage extends ChatThreadMessage>(
  current: TMessage[],
  incoming: TMessage[]
) {
  const byId = new Map<number | string, TMessage>();
  current.forEach((message) => byId.set(message.id, message));
  incoming.forEach((message) => {
    const existing = byId.get(message.id);
    byId.set(
      message.id,
      existing && messagesAreEquivalent(existing, message)
        ? existing
        : message
    );
  });
  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const unchanged =
    merged.length === current.length &&
    merged.every((message, index) => message === current[index]);

  return unchanged ? current : merged;
}

function messagesAreEquivalent(
  current: ChatThreadMessage,
  incoming: ChatThreadMessage
) {
  return (
    current.id === incoming.id &&
    current.content === incoming.content &&
    current.created_at === incoming.created_at &&
    current.sender.id === incoming.sender.id &&
    current.sender.first_name === incoming.sender.first_name &&
    current.sender.last_name === incoming.sender.last_name
  );
}

function buildRenderItems<TMessage extends ChatThreadMessage>(messages: TMessage[]) {
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
      messageDate.getTime() - new Date(previous.created_at).getTime() < GROUP_WINDOW_MS;

    items.push({
      type: "message",
      message,
      firstOfGroup: !withinGroupWindow,
      lastOfGroup: true,
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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ConversationIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full" aria-hidden="true">
      <path d="M11 13h31a8 8 0 0 1 8 8v13a8 8 0 0 1-8 8H27L15 51l2-10a8 8 0 0 1-6-7Z" />
      <path d="M24 27h.1M31 27h.1M38 27h.1" />
      <path d="M46 18h2a7 7 0 0 1 7 7v17l-7-5" opacity=".45" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function DownArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  );
}
