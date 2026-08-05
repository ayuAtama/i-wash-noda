import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getData() {
  const cookieStore = await cookies();

  const jwtCookie = cookieStore.get("access_token");
  const betterAuthCookie = cookieStore.get("better-auth.session_token");

  const cookieParts: string[] = [];
  if (jwtCookie) cookieParts.push(`${jwtCookie.name}=${jwtCookie.value}`);
  if (betterAuthCookie)
    cookieParts.push(`${betterAuthCookie.name}=${betterAuthCookie.value}`);

  const res = await fetch(`${API_URL}/api/me`, {
    headers: { cookie: cookieParts.join("; ") },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user data: ${res.status}`);
  }

  return res.json();
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <h1>User</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
