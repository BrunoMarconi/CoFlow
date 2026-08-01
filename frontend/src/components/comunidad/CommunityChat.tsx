"use client";

import ChatThread from "@/components/chat/ChatThread";
import {
  getCommunityMessages,
  sendCommunityMessage,
} from "@/services/communities";

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
      threadKey={communityId}
      currentUserId={currentUserId}
      fetchMessages={(params) => getCommunityMessages(communityId, params)}
      sendMessage={(content) =>
        sendCommunityMessage(communityId, { content })
      }
      showSenderName
      placeholder="Escribe un mensaje para la comunidad..."
      variant={variant}
    />
  );
}
