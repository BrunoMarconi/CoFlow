"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CHAT_MESSAGES_CHANGED_EVENT,
  type ChatMessageChangedDetail,
} from "@/lib/chatEvents";
import { MOTION_SPRING } from "@/lib/motionTokens";
import BottomSheet from "@/components/ui/BottomSheet";

const LONG_PRESS_MS = 450;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

type LongPressHandlers = {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (event: ReactMouseEvent) => void;
};

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

export interface ChatThreadReplyPreview {
  id: number | string;
  content: string;
  sender_id: string;
  sender_first_name: string;
}

export interface ChatThreadMessage {
  id: number | string;
  content: string;
  image_url?: string | null;
  created_at: string;
  sender: ChatThreadSender;
  reply_to?: ChatThreadReplyPreview | null;
  like_count?: number;
  liked_by_me?: boolean;
}

interface PendingMessage {
  id: string;
  content: string;
  createdAt: string;
  status: "sending" | "failed";
  replyTo?: ChatThreadReplyPreview | null;
  imagePreviewUrl?: string;
  imageFile?: File;
}

const TYPING_POLL_MS = 2500;
const TYPING_HEARTBEAT_MS = 2000;
const READ_POLL_MS = 4000;

export default function ChatThread<TMessage extends ChatThreadMessage>({
  threadKey,
  currentUserId,
  fetchMessages,
  sendMessage,
  showSenderName,
  placeholder,
  variant = "card",
  onMessagesReceived,
  canDeleteMessage,
  onDeleteMessage,
  onLikeMessage,
  onSendImage,
  onTypingHeartbeat,
  fetchTypingNames,
  onMarkRead,
  fetchReadUpTo,
  fetchMyLastReadId,
}: {
  threadKey: number | string;
  currentUserId: string;
  fetchMessages: (params: { limit: number; skip?: number }) => Promise<TMessage[]>;
  sendMessage: (content: string, replyToId?: number | string | null) => Promise<TMessage>;
  showSenderName: boolean;
  placeholder: string;
  variant?: "card" | "full";
  onMessagesReceived?: () => void;
  /** Si no se pasa, nadie puede borrar mensajes de otros (solo el
   * botón de reintentar en los propios que fallaron al enviar). */
  canDeleteMessage?: (message: TMessage) => boolean;
  onDeleteMessage?: (messageId: TMessage["id"]) => Promise<void>;
  /** Si no se pasa, no aparece la opción de "Me gusta". */
  onLikeMessage?: (messageId: TMessage["id"]) => Promise<TMessage>;
  /** Si no se pasa, no aparece el botón de adjuntar foto. */
  onSendImage?: (file: File, caption: string) => Promise<TMessage>;
  /** Avisa al otro lado de que estás escribiendo ahora mismo. */
  onTypingHeartbeat?: () => Promise<void>;
  /** Nombres de quienes están escribiendo ahora mismo (sin ti). */
  fetchTypingNames?: () => Promise<string[]>;
  onMarkRead?: (lastMessageId: TMessage["id"]) => Promise<void>;
  /** El id de mensaje más alto que alguien más ya ha leído — se usa
   * para pintar el doble check azul en tus propios mensajes. */
  fetchReadUpTo?: () => Promise<number | null>;
  /** Hasta dónde habías leído TÚ la última vez (antes de que abrir el
   * chat ahora lo actualice) — para pintar el separador de "mensajes
   * nuevos" justo donde lo dejaste. Se consulta una sola vez al abrir. */
  fetchMyLastReadId?: () => Promise<number | null>;
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
  const [menuMessage, setMenuMessage] = useState<TMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<TMessage | null>(null);
  const [likingMessageId, setLikingMessageId] = useState<TMessage["id"] | null>(null);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [readUpTo, setReadUpTo] = useState<number | null>(null);
  const [sendingImage, setSendingImage] = useState(false);
  const [myLastReadId, setMyLastReadId] = useState<number | null | undefined>(undefined);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fetchMessagesRef = useRef(fetchMessages);
  const sendMessageRef = useRef(sendMessage);
  const onMessagesReceivedRef = useRef(onMessagesReceived);
  const messagesRef = useRef<TMessage[]>([]);
  const seenMessageIdsRef = useRef(new Set<number | string>());
  const isNearBottomRef = useRef(true);
  const requestInFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const lastTypingHeartbeatRef = useRef(0);
  const lastMarkedReadIdRef = useRef<TMessage["id"] | null>(null);

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

  useEffect(() => {
    setMyLastReadId(undefined);
    if (!fetchMyLastReadId) return;
    let active = true;
    fetchMyLastReadId()
      .then((value) => {
        if (active) setMyLastReadId(value);
      })
      .catch(() => {
        if (active) setMyLastReadId(null);
      });
    return () => {
      active = false;
    };
  }, [threadKey, fetchMyLastReadId]);

  useEffect(() => {
    if (!fetchTypingNames) return;
    let active = true;

    async function poll() {
      try {
        const names = await fetchTypingNames!();
        if (active) setTypingNames(names);
      } catch {
        // Un fallo puntual del indicador de "escribiendo" no debe
        // interrumpir el resto del chat.
      }
    }

    void poll();
    const intervalId = setInterval(() => void poll(), TYPING_POLL_MS);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [threadKey, fetchTypingNames]);

  useEffect(() => {
    if (!fetchReadUpTo) return;
    let active = true;

    async function poll() {
      try {
        const value = await fetchReadUpTo!();
        if (active) setReadUpTo(value);
      } catch {
        // Igual que el indicador de escritura: no bloquea el chat.
      }
    }

    void poll();
    const intervalId = setInterval(() => void poll(), READ_POLL_MS);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [threadKey, fetchReadUpTo]);

  useEffect(() => {
    if (!onMarkRead || messages.length === 0) return;
    const newestId = messages[messages.length - 1].id;
    if (newestId === lastMarkedReadIdRef.current) return;
    lastMarkedReadIdRef.current = newestId;
    void onMarkRead(newestId).catch(() => {
      // Si falla, el próximo mensaje que llegue reintentará igualmente.
    });
  }, [messages, onMarkRead]);

  function notifyTyping() {
    if (!onTypingHeartbeat) return;
    const now = Date.now();
    if (now - lastTypingHeartbeatRef.current < TYPING_HEARTBEAT_MS) return;
    lastTypingHeartbeatRef.current = now;
    void onTypingHeartbeat().catch(() => {});
  }

  async function handleImageSelected(file: File) {
    if (!onSendImage || sendingImage) return;

    const caption = content.trim();
    const previewUrl = URL.createObjectURL(file);
    const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: PendingMessage = {
      id: pendingId,
      content: caption,
      createdAt: new Date().toISOString(),
      status: "sending",
      imagePreviewUrl: previewUrl,
      imageFile: file,
    };

    setPendingMessages((current) => [...current, optimisticMessage]);
    setContent("");
    setSendingImage(true);
    requestAnimationFrame(() => {
      resizeTextarea();
      scrollToBottom("smooth");
    });

    try {
      const delivered = await onSendImage(file, caption);
      seenMessageIdsRef.current.add(delivered.id);
      setMessages((current) => mergeMessages(current, [delivered]));
      setPendingMessages((current) => current.filter((message) => message.id !== pendingId));
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom("auto"));
      }
    } catch {
      setPendingMessages((current) =>
        current.map((message) =>
          message.id === pendingId ? { ...message, status: "failed" } : message
        )
      );
    } finally {
      setSendingImage(false);
    }
  }

  async function retryPendingMessage(pending: PendingMessage) {
    if (pending.imageFile && onSendImage) {
      setPendingMessages((current) =>
        current.map((message) =>
          message.id === pending.id ? { ...message, status: "sending" } : message
        )
      );
      try {
        const delivered = await onSendImage(pending.imageFile, pending.content);
        seenMessageIdsRef.current.add(delivered.id);
        setMessages((current) => mergeMessages(current, [delivered]));
        setPendingMessages((current) => current.filter((message) => message.id !== pending.id));
      } catch {
        setPendingMessages((current) =>
          current.map((message) =>
            message.id === pending.id ? { ...message, status: "failed" } : message
          )
        );
      }
      return;
    }

    void deliverMessage(pending);
  }

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
      const delivered = await sendMessageRef.current(
        pending.content,
        pending.replyTo?.id ?? null
      );
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
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            sender_id: replyingTo.sender.id,
            sender_first_name: replyingTo.sender.first_name,
          }
        : null,
    };

    setPendingMessages((current) => [...current, optimisticMessage]);
    setContent("");
    setReplyingTo(null);
    requestAnimationFrame(() => {
      resizeTextarea();
      scrollToBottom("smooth");
    });
    void deliverMessage(optimisticMessage);
  }

  async function handleDeleteMessage(message: TMessage) {
    if (!onDeleteMessage) return;
    if (!window.confirm("¿Borrar este mensaje?")) return;

    try {
      await onDeleteMessage(message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
    } catch {
      setLoadError("No hemos podido borrar el mensaje.");
    }
  }

  async function handleLikeMessage(message: TMessage) {
    if (!onLikeMessage || likingMessageId !== null) return;
    setLikingMessageId(message.id);
    try {
      const updated = await onLikeMessage(message.id);
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? updated : item))
      );
    } catch {
      setLoadError("No hemos podido guardar el \"me gusta\".");
    } finally {
      setLikingMessageId(null);
    }
  }

  function openMessageMenu(message: TMessage) {
    setMenuMessage(message);
  }

  // Pulsación larga (móvil) o clic derecho (escritorio) sobre una
  // burbuja abre el menú de acciones — igual que WhatsApp. Un simple
  // timeout basta: se cancela si el dedo se mueve más de la
  // tolerancia (para no confundirlo con un scroll) o se levanta antes.
  function longPressHandlers(message: TMessage): LongPressHandlers {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let start: { x: number; y: number } | null = null;

    function clear() {
      if (timer) clearTimeout(timer);
      timer = null;
      start = null;
    }

    return {
      onPointerDown: (event: ReactPointerEvent) => {
        if (event.pointerType === "mouse") return;
        start = { x: event.clientX, y: event.clientY };
        timer = setTimeout(() => {
          openMessageMenu(message);
          clear();
        }, LONG_PRESS_MS);
      },
      onPointerMove: (event: ReactPointerEvent) => {
        if (!start) return;
        const dx = Math.abs(event.clientX - start.x);
        const dy = Math.abs(event.clientY - start.y);
        if (dx > LONG_PRESS_MOVE_TOLERANCE_PX || dy > LONG_PRESS_MOVE_TOLERANCE_PX) {
          clear();
        }
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onContextMenu: (event: ReactMouseEvent) => {
        event.preventDefault();
        openMessageMenu(message);
      },
    };
  }

  function startReply(message: TMessage) {
    setReplyingTo(message);
    setMenuMessage(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
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

  const renderItems = useMemo(
    () => buildRenderItems(messages, myLastReadId, currentUserId),
    [messages, myLastReadId, currentUserId]
  );
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
                ) : item.type === "unread-divider" ? (
                  <div key={item.key} className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-red-200" />
                    <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600">
                      Mensajes nuevos
                    </span>
                    <span className="h-px flex-1 bg-red-200" />
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
                      canLike={Boolean(onLikeMessage)}
                      onQuickLike={() => void handleLikeMessage(item.message)}
                      pressHandlers={longPressHandlers(item.message)}
                      isRead={Boolean(
                        fetchReadUpTo &&
                          readUpTo !== null &&
                          typeof item.message.id === "number" &&
                          item.message.id <= readUpTo
                      )}
                      showReadStatus={Boolean(fetchReadUpTo)}
                      onOpenImage={setLightboxUrl}
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
                    onRetry={() => void retryPendingMessage(message)}
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

      {typingNames.length > 0 && (
        <div className="flex items-center gap-1.5 border-t border-border bg-surface px-4 py-1.5 text-xs font-semibold text-secondary">
          <TypingDots />
          {typingNames.length === 1
            ? `${typingNames[0]} está escribiendo…`
            : `${typingNames.slice(0, 2).join(", ")} están escribiendo…`}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-surface px-3 pb-[max(0.75rem,var(--safe-bottom))] pt-3 sm:px-4 sm:pb-4"
      >
        {replyingTo && (
          <div className="mb-2 flex items-center gap-2 rounded-14 border-l-4 border-primary bg-primary/6 py-1.5 pl-2.5 pr-1.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-primary-dark">
                Respondiendo a {replyingTo.sender.first_name}
              </p>
              <p className="truncate text-xs text-secondary">{replyingTo.content}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              aria-label="Cancelar respuesta"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-soft"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-24 border border-border bg-surface-soft px-2 py-2 shadow-[inset_0_1px_2px_rgb(0_0_0/0.03)] transition-all duration-200 focus-within:border-primary/50 focus-within:bg-surface focus-within:shadow-[0_2px_12px_-2px_rgb(0_0_0/0.08)] focus-within:ring-4 focus-within:ring-primary/10">
          {onSendImage && (
            <>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void handleImageSelected(file);
                }}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={sendingImage}
                aria-label="Adjuntar foto"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-foreground disabled:opacity-50"
              >
                <ImageIcon />
              </button>
            </>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              resizeTextarea();
              notifyTyping();
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

      {menuMessage && (
        <BottomSheet onClose={() => setMenuMessage(null)} ariaLabel="Acciones del mensaje" className="sm:max-w-xs">
          <div className="p-4">
            <p className="truncate rounded-14 bg-surface-soft px-3 py-2 text-xs text-secondary">
              {menuMessage.content}
            </p>

            <div className="mt-2 divide-y divide-border">
              <button
                type="button"
                onClick={() => startReply(menuMessage)}
                className="flex h-13 w-full items-center gap-3 px-1 text-left text-sm font-semibold text-foreground"
              >
                <ReplyIcon /> Responder
              </button>

              {onLikeMessage && (
                <button
                  type="button"
                  onClick={() => {
                    void handleLikeMessage(menuMessage);
                    setMenuMessage(null);
                  }}
                  className="flex h-13 w-full items-center gap-3 px-1 text-left text-sm font-semibold text-foreground"
                >
                  <HeartIcon filled={menuMessage.liked_by_me ?? false} />
                  {menuMessage.liked_by_me ? "Quitar me gusta" : "Me gusta"}
                </button>
              )}

              {onDeleteMessage && canDeleteMessage?.(menuMessage) && (
                <button
                  type="button"
                  onClick={() => {
                    const target = menuMessage;
                    setMenuMessage(null);
                    void handleDeleteMessage(target);
                  }}
                  className="flex h-13 w-full items-center gap-3 px-1 text-left text-sm font-semibold text-red-600"
                >
                  <DeleteIcon /> Borrar mensaje
                </button>
              )}
            </div>
          </div>
        </BottomSheet>
      )}

      <AnimatePresence>
        {lightboxUrl && (
          <ImageLightbox key={lightboxUrl} url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-[calc(1rem+var(--safe-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <CloseIcon />
      </button>
      <img
        src={url}
        alt="Foto ampliada"
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full rounded-14 object-contain"
      />
    </motion.div>,
    document.body
  );
}

const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showSenderName,
  firstOfGroup,
  lastOfGroup,
  canLike,
  onQuickLike,
  pressHandlers,
  isRead,
  showReadStatus,
  onOpenImage,
}: {
  message: ChatThreadMessage;
  isOwn: boolean;
  showSenderName: boolean;
  firstOfGroup: boolean;
  lastOfGroup: boolean;
  canLike: boolean;
  onQuickLike: () => void;
  pressHandlers: LongPressHandlers;
  isRead: boolean;
  showReadStatus: boolean;
  onOpenImage: (url: string) => void;
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

  const likeCount = message.like_count ?? 0;
  const likedByMe = message.liked_by_me ?? false;

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

      <div className="relative max-w-[84%] min-w-0 sm:max-w-[72%]">
        <div
          {...pressHandlers}
          className={cn(
            "select-none touch-none rounded-18 px-3.5 py-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)]",
            isOwn
              ? cn(
                  "bg-chat-bubble-own text-foreground",
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

          {message.reply_to && (
            <div
              className={cn(
                "mb-1.5 rounded-10 border-l-4 px-2.5 py-1.5 text-xs leading-5",
                isOwn
                  ? "border-primary/40 bg-black/5 text-secondary"
                  : "border-primary/50 bg-primary/6 text-secondary"
              )}
            >
              <p className="truncate font-bold text-primary-dark">
                {message.reply_to.sender_first_name}
              </p>
              <p className="truncate">{message.reply_to.content}</p>
            </div>
          )}

          {message.image_url && (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onOpenImage(message.image_url as string)}
              className="-mx-3.5 -mt-2 mb-1.5 block w-[calc(100%+1.75rem)] overflow-hidden first:mt-0"
            >
              <img
                src={message.image_url}
                alt="Foto enviada en el chat"
                className="max-h-72 w-full object-cover"
                loading="lazy"
              />
            </button>
          )}

          {message.content && (
            <p className="chat-message-text whitespace-pre-wrap text-[15px] leading-6 wrap-anywhere">
              {message.content}
            </p>
          )}

          <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-medium text-muted">
            {formatMessageTime(message.created_at)}
            {isOwn && showReadStatus && <ReadTicks read={isRead} />}
          </p>
        </div>

        {canLike && likeCount > 0 && (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onQuickLike}
            aria-label={likedByMe ? "Quitar me gusta" : "Me gusta"}
            className={cn(
              "absolute -bottom-2.5 flex h-5 items-center gap-0.5 rounded-full border border-border bg-surface px-1.5 text-[10px] font-bold shadow-soft",
              isOwn ? "left-1.5" : "right-1.5",
              likedByMe ? "text-red-600" : "text-secondary"
            )}
          >
            <HeartIcon filled={likedByMe} />
            {likeCount}
          </button>
        )}
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
          "chat-tail-own max-w-[84%] rounded-18 rounded-br-md bg-chat-bubble-own px-3.5 py-2 text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] sm:max-w-[72%]",
          message.status === "sending" && "opacity-80"
        )}
      >
        {message.replyTo && (
          <div className="mb-1.5 rounded-10 border-l-4 border-primary/40 bg-black/5 px-2.5 py-1.5 text-xs leading-5 text-secondary">
            <p className="truncate font-bold text-primary-dark">{message.replyTo.sender_first_name}</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}
        {message.imagePreviewUrl && (
          <div className="-mx-3.5 -mt-2 mb-1.5 overflow-hidden">
            <img src={message.imagePreviewUrl} alt="" className="max-h-72 w-full object-cover opacity-90" />
          </div>
        )}
        {message.content && (
          <p className="chat-message-text whitespace-pre-wrap text-[15px] leading-6 wrap-anywhere">
            {message.content}
          </p>
        )}
        <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[10px] font-medium text-muted">
          <span>{formatMessageTime(message.createdAt)}</span>
          {message.status === "sending" ? (
            <span>Enviando…</span>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-6 rounded-full border border-red-300 px-2 font-bold text-red-600"
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
    current.sender.last_name === incoming.sender.last_name &&
    (current.like_count ?? 0) === (incoming.like_count ?? 0) &&
    (current.liked_by_me ?? false) === (incoming.liked_by_me ?? false)
  );
}

function buildRenderItems<TMessage extends ChatThreadMessage>(
  messages: TMessage[],
  myLastReadId: number | null | undefined,
  currentUserId: string
) {
  type Item =
    | { type: "date"; key: string; label: string }
    | { type: "unread-divider"; key: string }
    | { type: "message"; message: TMessage; firstOfGroup: boolean; lastOfGroup: boolean };
  const items: Item[] = [];

  // Solo se marca la PRIMERA vez que aparece un mensaje de otra
  // persona posterior a lo último que leíste — no tiene sentido en una
  // conversación que nunca has abierto antes (myLastReadId === null),
  // ahí no hay "hasta dónde llegaste" con lo que comparar.
  let unreadDividerPlaced = myLastReadId == null;

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

    if (
      !unreadDividerPlaced &&
      typeof message.id === "number" &&
      message.id > (myLastReadId as number) &&
      message.sender.id !== currentUserId
    ) {
      items.push({ type: "unread-divider", key: `unread-${message.id}` });
      unreadDividerPlaced = true;
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
    item.lastOfGroup = !next || next.type !== "message" || next.firstOfGroup;
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
      <path d="M19 8.6c0 4.3-4.6 7.5-7 9.7-2.4-2.2-7-5.4-7-9.7C5 5.6 7.2 4 9.3 4c1.3 0 2.4.6 2.7 1.7C12.3 4.6 13.4 4 14.7 4 16.8 4 19 5.6 19 8.6Z" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M9 10 4 15l5 5" />
      <path d="M4 15h10a6 6 0 0 0 6-6V4" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
  );
}

function ReadTicks({ read }: { read: boolean }) {
  return (
    <svg viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-3 w-4.5 shrink-0", read && "text-sky-500")} aria-hidden="true">
      <path d="m1 8 4 4 4-8" />
      <path d="m9 8 4 4 8-11" />
    </svg>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-0.5">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" />
    </span>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5.5 w-5.5" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-3 4 4" />
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
