export interface PrivateMessageSender {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export interface PrivateMessage {
  id: number;
  connection_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  sender: PrivateMessageSender;
}

export interface PrivateMessageCreate {
  content: string;
}

export interface PrivateConversationSummary {
  connection: import("@/types/connection").UserConnection;
  last_message: PrivateMessage | null;
}

export interface GetPrivateMessagesParams {
  skip?: number;
  limit?: number;
}
