import { api } from "./api";
import type { UserConnection, UserConnectionRequests } from "@/types/connection";
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
