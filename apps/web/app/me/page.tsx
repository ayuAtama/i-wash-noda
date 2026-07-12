// export default async function Page() {
//   const res = await fetch("http://localhost:3000/api/me", {
//     method: "GET",
//     cache: "no-store", // ensures fresh data on every request
//     credentials: "include", // REQUIRED
//   });

//   if (!res.ok) {
//     throw new Error("Failed to fetch user data");
//   }

//   const data = await res.json();

//   return (
//     <div>
//       <h1>User</h1>
//       <pre>{JSON.stringify(data, null, 2)}</pre>
//     </div>
//   );
// }

// "use client";

// import { useEffect, useState } from "react";

// export default function Page() {
//   const [data, setData] = useState(null);

//   useEffect(() => {
//     fetch("http://localhost:3000/api/me", {
//       credentials: "include",
//     })
//       .then((res) => res.json())
//       .then(setData);
//   }, []);

//   return <pre>{JSON.stringify(data, null, 2)}</pre>;
// }

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getData() {
  const cookieStore = await cookies();

  const authCookie = cookieStore.get("better-auth.session_token");
  const cookieHeader = `${authCookie?.name}=${authCookie?.value}`;

  const res = await fetch(`${API_URL}/api/me`, {
    headers: { cookie: cookieHeader },
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
