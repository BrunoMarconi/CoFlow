export interface PrivateMessageSender {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export interface PrivateMessageReplyPreview {
  id: number;
  content: string;
  sender_id: string;
  sender_first_name: string;
}

export interface PrivateMessage {
  id: number;
  connection_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  sender: PrivateMessageSender;
  reply_to: PrivateMessageReplyPreview | null;
  like_count: number;
  liked_by_me: boolean;
}

export interface PrivateMessageCreate {
  content: string;
  reply_to_id?: number | null;
}

export interface PrivateConversationSummary {
  connection: import("@/types/connection").UserConnection;
  last_message: PrivateMessage | null;
}

export interface GetPrivateMessagesParams {
  skip?: number;
  limit?: number;
}
