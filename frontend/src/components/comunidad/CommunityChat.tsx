"use client";

import ChatThread from "@/components/chat/ChatThread";
import {
  getCommunityMessages,
  sendCommunityMessage,
} from "@/services/communities";
import { markConversationReadNow } from "@/lib/conversationReadState";

export default function CommunityChat({
  communityId,
  currentUserId,
  variant = "card",
}: {
  communityId: number;
  currentUserId: string;
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
    />
  );
}
