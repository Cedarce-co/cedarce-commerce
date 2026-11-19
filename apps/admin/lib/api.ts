import { cookies } from "next/headers";
import { apiBase } from "@cedarce/ui";

/** Server-side admin fetch forwarding the session cookie to the API. */
export async function adminGet<T>(path: string): Promise<T | null> {
  const cookie = (await cookies()).get("cedarce_admin");
  const res = await fetch(`${apiBase()}/v1/admin${path}`, {
    headers: cookie ? { cookie: `${cookie.name}=${cookie.value}` } : {},
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return (await res.json()) as T;
}

export async function adminMutate(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
) {
  const cookie = (await cookies()).get("cedarce_admin");
  const res = await fetch(`${apiBase()}/v1/admin${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie: `${cookie.name}=${cookie.value}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${method} ${path}`);
  return res.json();
}
