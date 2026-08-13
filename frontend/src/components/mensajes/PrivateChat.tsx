"use client";

import ChatThread from "@/components/chat/ChatThread";
import { useAuth } from "@/hooks/useAuth";
import { getPrivateMessages, sendPrivateMessage } from "@/services/connections";
import { markConversationReadNow } from "@/lib/conversationReadState";

export default function PrivateChat({
  connectionId,
  currentUserId,
  variant = "card",
}: {
  connectionId: number;
  currentUserId: string;
  variant?: "card" | "full";
}) {
  const { markNotificationsForLinkAsRead } = useAuth();

  return (
    <ChatThread
      key={`connection:${connectionId}`}
      threadKey={`connection:${connectionId}`}
      currentUserId={currentUserId}
      fetchMessages={(params) => getPrivateMessages(connectionId, params)}
      sendMessage={(content) =>
        sendPrivateMessage(connectionId, { content })
      }
      showSenderName={false}
      placeholder="Escribe un mensaje..."
      variant={variant}
      onMessagesReceived={() => {
        markConversationReadNow(`connection:${connectionId}`);
        void markNotificationsForLinkAsRead(`/mensajes/${connectionId}`).catch(
          () => {}
        );
      }}
    />
  );
}
