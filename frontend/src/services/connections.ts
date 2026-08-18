import { api } from "./api";
import type {
  UserConnection,
  UserConnectionOverview,
  UserConnectionRequests,
} from "@/types/connection";
import type {
  GetPrivateMessagesParams,
  PrivateConversationSummary,
  PrivateMessage,
  PrivateMessageCreate,
} from "@/types/privateMessage";

export async function getConnections() {
  const { data } = await api.get<UserConnection[]>("/connections");
  return data;
}

export async function getPrivateConversationInbox() {
  const { data } = await api.get<PrivateConversationSummary[]>(
    "/connections/inbox"
  );
  return data;
}

export async function getConnectionRequests() {
  const { data } = await api.get<UserConnectionRequests>(
    "/connections/requests"
  );

  return data;
}

export async function getConnectionOverview() {
  // Se compone con las rutas estables para que el frontend no dependa de
  // que el backend nuevo y el deploy web se publiquen exactamente a la vez.
  // Ambas lecturas son independientes y salen en paralelo.
  const [accepted, requests] = await Promise.all([
    getConnections(),
    getConnectionRequests(),
  ]);

  return {
    accepted,
    received: requests.received,
    sent: requests.sent,
  } satisfies UserConnectionOverview;
}

export async function acceptConnection(connectionId: number) {
  const { data } = await api.post<UserConnection>(
    `/connections/${connectionId}/accept`
  );

  return data;
}

export async function rejectConnection(connectionId: number) {
  const { data } = await api.post<UserConnection>(
    `/connections/${connectionId}/reject`
  );

  return data;
}

export async function cancelConnection(connectionId: number) {
  const { data } = await api.post<UserConnection>(
    `/connections/${connectionId}/cancel`
  );

  return data;
}

export async function deleteConnection(connectionId: number) {
  const { data } = await api.delete<{ message: string }>(
    `/connections/${connectionId}`
  );

  return data;
}

export async function getPrivateMessages(
  connectionId: number | string,
  params?: GetPrivateMessagesParams
) {
  const { data } = await api.get<PrivateMessage[]>(
    `/connections/${connectionId}/messages`,
    { params }
  );

  return data;
}

export async function sendPrivateMessage(
  connectionId: number | string,
  payload: PrivateMessageCreate
) {
  const { data } = await api.post<PrivateMessage>(
    `/connections/${connectionId}/messages`,
    payload
  );

  return data;
}

export async function deletePrivateMessage(
  connectionId: number | string,
  messageId: number | string
) {
  await api.delete(`/connections/${connectionId}/messages/${messageId}`);
}

export async function likePrivateMessage(
  connectionId: number | string,
  messageId: number | string
) {
  const { data } = await api.post<PrivateMessage>(
    `/connections/${connectionId}/messages/${messageId}/like`
  );

  return data;
}

export async function sendPrivateImageMessage(
  connectionId: number | string,
  file: File,
  content: string
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("content", content);

  const { data } = await api.post<PrivateMessage>(
    `/connections/${connectionId}/messages/image`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
}

export async function markPrivateMessagesRead(
  connectionId: number | string,
  lastReadMessageId: number
) {
  await api.post(`/connections/${connectionId}/messages/read`, {
    last_read_message_id: lastReadMessageId,
  });
}

export async function getMyPrivateReadState(connectionId: number | string) {
  const { data } = await api.get<{ last_read_message_id: number | null }>(
    `/connections/${connectionId}/messages/read/me`
  );
  return data.last_read_message_id;
}

export async function getPrivateReadReceipt(connectionId: number | string) {
  const { data } = await api.get<{ last_read_message_id: number | null }>(
    `/connections/${connectionId}/messages/read`
  );
  return data.last_read_message_id;
}

export async function sendPrivateTyping(connectionId: number | string) {
  await api.post(`/connections/${connectionId}/typing`);
}

export async function getPrivateTyping(connectionId: number | string) {
  const { data } = await api.get<{ typing_names: string[] }>(
    `/connections/${connectionId}/typing`
  );
  return data.typing_names;
}
