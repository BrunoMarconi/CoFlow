"use client";

import ChatThread from "@/components/chat/ChatThread";
import { getPrivateMessages, sendPrivateMessage } from "@/services/connections";

export default function PrivateChat({
  connectionId,
  currentUserId,
  variant = "card",
}: {
  connectionId: number;
  currentUserId: string;
  variant?: "card" | "full";
}) {
  return (
    <ChatThread
      threadKey={connectionId}
      currentUserId={currentUserId}
      fetchMessages={(params) => getPrivateMessages(connectionId, params)}
      sendMessage={(content) =>
        sendPrivateMessage(connectionId, { content })
      }
      showSenderName={false}
      placeholder="Escribe un mensaje..."
      variant={variant}
    />
  );
}
