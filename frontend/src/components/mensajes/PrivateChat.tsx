"use client";

import ChatThread from "@/components/chat/ChatThread";
import { useAuth } from "@/hooks/useAuth";
import {
  deletePrivateMessage,
  getPrivateMessages,
  likePrivateMessage,
  sendPrivateMessage,
} from "@/services/connections";
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
      sendMessage={(content, replyToId) =>
        sendPrivateMessage(connectionId, {
          content,
          reply_to_id: typeof replyToId === "number" ? replyToId : null,
        })
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
      canDeleteMessage={(message) => message.sender.id === currentUserId}
      onDeleteMessage={(messageId) =>
        deletePrivateMessage(connectionId, messageId)
      }
      onLikeMessage={(messageId) => likePrivateMessage(connectionId, messageId)}
    />
  );
}
