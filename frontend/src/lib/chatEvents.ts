export const CHAT_MESSAGES_CHANGED_EVENT = "coflow:chat-messages-changed";

export interface ChatMessageChangedDetail {
  threadKey: string;
  message: {
    id: number | string;
    content: string;
    created_at: string;
    sender: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url?: string | null;
    };
  };
}
