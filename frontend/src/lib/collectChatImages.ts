export interface ChatImageItem {
  url: string;
  created_at: string;
}

interface ChatImageMessage {
  image_url?: string | null;
  created_at: string;
}

/** No hay un endpoint de "solo fotos" en el backend — se reutiliza la
 * misma paginación de mensajes que ya usa el chat (loadOlderMessages) y
 * se filtra en el cliente. Un límite de páginas razonable evita traer
 * un historial entero de miles de mensajes solo para sacar unas fotos. */
export async function collectChatImages(
  fetchMessages: (params: {
    limit: number;
    skip?: number;
  }) => Promise<ChatImageMessage[]>,
  { maxPages = 5, pageSize = 100 }: { maxPages?: number; pageSize?: number } = {}
): Promise<ChatImageItem[]> {
  const images: ChatImageItem[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await fetchMessages({ limit: pageSize, skip: page * pageSize });
    for (const message of batch) {
      if (message.image_url) {
        images.push({ url: message.image_url, created_at: message.created_at });
      }
    }
    if (batch.length < pageSize) break;
  }

  return images.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
