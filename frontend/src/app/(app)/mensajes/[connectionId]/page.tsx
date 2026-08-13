"use client";

import { useParams } from "next/navigation";
import PrivateConversationPage from "@/components/mensajes/PrivateConversationPage";

export default function MensajesPage() {
  const params = useParams<{ connectionId: string }>();
  return <PrivateConversationPage connectionId={Number(params.connectionId)} />;
}
