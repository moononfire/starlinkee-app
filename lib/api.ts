const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://starlinkee.com";

async function request<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<{
  ok: boolean;
  status: number;
  data: T;
}> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export function requestOtp(phone: string) {
  return request<{ ok?: true; error?: string }>("/api/mobile/loyalty/request-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone: string, code: string, email?: string) {
  return request<{ ok?: true; token?: string; error?: string }>("/api/mobile/loyalty/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, code, email }),
  });
}

export function getGoogleEmail(accessToken: string) {
  return request<{ email?: string; error?: string }>("/api/mobile/loyalty/google-email", {
    method: "POST",
    body: JSON.stringify({ accessToken }),
  });
}

export function collectStamp(token: string, slug: string, scanToken: string | undefined) {
  return request<{ stamps?: number; reward_ready?: boolean; error?: string; remaining_seconds?: number }>(
    "/api/mobile/loyalty/collect",
    { method: "POST", token, body: JSON.stringify({ slug, scanToken }) }
  );
}

export function claimReward(token: string, slug: string) {
  return request<{ ok?: true; stamps?: number; error?: string }>("/api/mobile/loyalty/claim", {
    method: "POST",
    token,
    body: JSON.stringify({ slug }),
  });
}

export function getCard(token: string, slug: string) {
  return request<{ stamps: number; reward_ready: boolean; max_stamps: number }>(
    `/api/mobile/loyalty/card?slug=${encodeURIComponent(slug)}`,
    { method: "GET", token }
  );
}
