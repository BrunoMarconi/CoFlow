"use client";

import ChatThread, { type ChatThreadMessage } from "@/components/chat/ChatThread";
import {
  deleteCommunityMessage,
  getCommunityMessages,
  getCommunityReadReceipts,
  getCommunityTyping,
  likeCommunityMessage,
  markCommunityMessagesRead,
  sendCommunityImageMessage,
  sendCommunityMessage,
  sendCommunityTyping,
} from "@/services/communities";
import { markConversationReadNow } from "@/lib/conversationReadState";

export default function CommunityChat({
  communityId,
  currentUserId,
  isOwner = false,
  variant = "card",
}: {
  communityId: number;
  currentUserId: string;
  /** El administrador de la comunidad puede borrar cualquier mensaje
   * del chat, no solo los suyos — antes no había ninguna forma de
   * moderarlo. */
  isOwner?: boolean;
  variant?: "card" | "full";
}) {
  return (
    <ChatThread
      key={`community:${communityId}`}
      threadKey={`community:${communityId}`}
      currentUserId={currentUserId}
      fetchMessages={(params) => getCommunityMessages(communityId, params)}
      sendMessage={(content, replyToId) =>
        sendCommunityMessage(communityId, {
          content,
          reply_to_id: typeof replyToId === "number" ? replyToId : null,
        })
      }
      showSenderName
      placeholder="Escribe un mensaje para la comunidad..."
      variant={variant}
      onMessagesReceived={() => markConversationReadNow("community")}
      canDeleteMessage={(message: ChatThreadMessage) =>
        isOwner || message.sender.id === currentUserId
      }
      onDeleteMessage={(messageId) =>
        deleteCommunityMessage(communityId, messageId)
      }
      onLikeMessage={(messageId) => likeCommunityMessage(communityId, messageId)}
      onSendImage={(file, caption) =>
        sendCommunityImageMessage(communityId, file, caption)
      }
      onTypingHeartbeat={() => sendCommunityTyping(communityId)}
      fetchTypingNames={() => getCommunityTyping(communityId)}
      onMarkRead={(messageId) =>
        markCommunityMessagesRead(communityId, Number(messageId))
      }
      fetchReadUpTo={async () => {
        const readBy = await getCommunityReadReceipts(communityId);
        const values = Object.values(readBy);
        return values.length > 0 ? Math.max(...values) : null;
      }}
    />
  );
}
