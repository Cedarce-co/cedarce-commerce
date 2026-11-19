import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { apiBase } from "@cedarce/ui";

async function login(formData: FormData) {
  "use server";
  const res = await fetch(`${apiBase()}/v1/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }),
  });
  if (!res.ok) redirect("/login?error=1");
  const setCookie = res.headers.get("set-cookie") ?? "";
  const m = setCookie.match(/cedarce_admin=([^;]+)/);
  if (m?.[1])
    (await cookies()).set("cedarce_admin", decodeURIComponent(m[1]), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  redirect("/");
}

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <form
      action={login}
      className="mx-auto mt-20 max-w-sm space-y-3 rounded-xl border bg-white p-6"
    >
      <h1 className="text-xl font-bold">Sign in</h1>
      {error ? <p className="text-sm text-red-600">Invalid email or password.</p> : null}
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full rounded border px-3 py-2"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="Password"
        className="w-full rounded border px-3 py-2"
      />
      <button className="w-full rounded bg-brand-600 py-2 font-semibold text-white">Sign in</button>
    </form>
  );
}
