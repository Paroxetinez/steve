type EverMemMessagePayload = {
  message_id: string;
  create_time: string;
  sender: string;
  sender_name: string;
  role: "user" | "assistant";
  content: string;
  group_id: string;
  group_name: string;
  refer_list: string[];
};

function getEverMemBaseUrl() {
  return process.env.EVERMEMOS_BASE_URL ?? "http://localhost:1995/api/v1";
}

function getEverMemHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.EVERMEMOS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.EVERMEMOS_API_KEY}`;
  }

  return headers;
}

export async function postMemoryMessage(payload: EverMemMessagePayload) {
  const response = await fetch(`${getEverMemBaseUrl()}/memories`, {
    method: "POST",
    headers: getEverMemHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`EverMemOS write failed with status ${response.status}`);
  }

  return response.json();
}

export async function searchMemories(payload: Record<string, unknown>) {
  const response = await fetch(`${getEverMemBaseUrl()}/memories/search`, {
    method: "POST",
    headers: getEverMemHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`EverMemOS search failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchMemories(query: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }

  const response = await fetch(`${getEverMemBaseUrl()}/memories?${params.toString()}`, {
    method: "GET",
    headers: getEverMemHeaders(),
  });

  if (!response.ok) {
    throw new Error(`EverMemOS fetch failed with status ${response.status}`);
  }

  return response.json();
}
