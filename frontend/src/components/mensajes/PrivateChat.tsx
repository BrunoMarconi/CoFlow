"use client";

import {
  memo,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  getPrivateMessages,
  sendPrivateMessage,
} from "@/services/connections";
import type { PrivateMessage } from "@/types/privateMessage";

const POLL_INTERVAL_MS = 5000;
const NEAR_BOTTOM_THRESHOLD_PX = 120;
const MAX_TEXTAREA_HEIGHT_PX = 120;

export default function PrivateChat({
  connectionId,
  currentUserId,
}: {
  connectionId: number;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
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

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function fetchMessages(showSpinner: boolean) {
      if (showSpinner) setLoading(true);

      getPrivateMessages(connectionId, { limit: 100 })
        .then((data) => {
          if (!active) return;
          setMessages(data);
          setLoadError("");
        })
        .catch(() => {
          if (!active) return;
          setLoadError(
            "No pudimos cargar los mensajes. Intenta de nuevo."
          );
        })
        .finally(() => {
          if (active && showSpinner) setLoading(false);
        });
    }

    function startPolling() {
      if (intervalId) return;

      intervalId = setInterval(() => {
        fetchMessages(false);
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
        fetchMessages(false);
        startPolling();
      } else {
        stopPolling();
      }
    }

    fetchMessages(true);

    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      active = false;
      stopPolling();
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [connectionId]);

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
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

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
      const message = await sendPrivateMessage(connectionId, {
        content: trimmed,
      });

      setMessages((current) => [...current, message]);
      setContent("");

      requestAnimationFrame(autoResizeTextarea);
    } catch {
      setSendError(
        "No pudimos enviar tu mensaje. Inténtalo de nuevo."
      );
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

  return (
    <div className="flex h-[min(72dvh,640px)] min-h-[420px] flex-col overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-sm">
      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full space-y-3 overflow-y-auto p-4 sm:p-5"
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
              <p className="text-sm font-semibold text-[#163B2E]">
                Todavía no hay mensajes.
              </p>
              <p className="text-sm text-gray-500">
                Escribe el primero para empezar la conversación.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender.id === currentUserId}
              />
            ))
          )}
        </div>

        {!isNearBottom && messages.length > 0 && (
          <button
            type="button"
            onClick={scrollToRecent}
            className="absolute bottom-3 left-1/2 flex h-10 -translate-x-1/2 items-center gap-2 rounded-full bg-[#163B2E] px-4 text-xs font-bold text-white shadow-lg transition active:scale-95"
          >
            <DownArrowIcon />
            {newArrivals > 0
              ? `${newArrivals} ${
                  newArrivals === 1 ? "mensaje nuevo" : "mensajes nuevos"
                }`
              : "Volver a los mensajes recientes"}
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-gray-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-3 sm:p-4"
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            autoResizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          maxLength={2000}
          disabled={sending}
          rows={1}
          className="max-h-[120px] min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-2.5 text-base leading-6 text-[#163B2E] outline-none transition focus:border-green-400 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={sending || !content.trim()}
          aria-label="Enviar mensaje"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-2 sm:px-5"
        >
          {sending ? <LoadingIcon /> : <SendIcon />}
          <span className="hidden text-sm font-bold sm:inline">Enviar</span>
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
}: {
  message: PrivateMessage;
  isOwn: boolean;
}) {
  const initials = [message.sender.first_name, message.sender.last_name]
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const time = formatMessageTime(message.created_at);

  return (
    <div
      className={`flex items-end gap-2 ${
        isOwn ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isOwn
            ? "bg-green-500 text-white"
            : "bg-[#163B2E] text-white"
        }`}
      >
        {initials || "CF"}
      </div>

      <div
        className={`max-w-[82%] min-w-0 rounded-2xl px-4 py-3 ${
          isOwn
            ? "rounded-br-md bg-green-500 text-white"
            : "rounded-bl-md bg-[#F8FAFC] text-[#163B2E]"
        }`}
      >
        <p className="whitespace-pre-line text-sm leading-6 wrap-anywhere">
          {message.content}
        </p>

        <p
          className={`mt-1 text-[10px] font-semibold ${
            isOwn ? "text-white/70" : "text-gray-400"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
});

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
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-500" />
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
