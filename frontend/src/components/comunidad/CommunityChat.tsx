"use client";

import ChatThread, { type ChatThreadMessage } from "@/components/chat/ChatThread";
import {
  deleteCommunityMessage,
  getCommunityMessages,
  sendCommunityMessage,
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
      sendMessage={(content) =>
        sendCommunityMessage(communityId, { content })
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
    />
  );
}
