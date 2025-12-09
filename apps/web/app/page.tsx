"use client";

import { authClient, signOut, useSession } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending, error, refetch } = useSession();

  const fields = ["id", "email", "name"] as const;
  const handleLogout = () => {
    authClient.signOut();
  };
  return (
    <div>
      <h1>Homepage</h1>

      {isPending && <p>Loading…</p>}
      {error && <p>Error: {error.message}</p>}

      {session?.user ? (
        <div>
          <p>Logged in as {session.user.email}</p>
          {/* map the session data */}
          {Object.entries(session.user).map(([key, value]) => (
            <p key={key}>
              {key}: {String(value)}
            </p>
          ))}
          <br />
          {/* map spesific data */}
          {(["id", "email", "name"] as Array<keyof typeof session.user>).map(
            (key) => (
              <p key={key}>
                {key}: {String(session.user[key])}
              </p>
            )
          )}

          <br />

          {fields.map((key) => (
            <p key={key}>
              {key}: {String(session.user[key])}
            </p>
          ))}

          <br />
          <pre>{JSON.stringify(session, null, 2)}</pre>
          <br />
          {(Object.keys(session.user) as Array<keyof typeof session.user>).map(
            (key) => (
              <p key={key}>
                {key}: {String(session.user[key])}
              </p>
            )
          )}
          <br />
          <form action="/" method="post">
            <button type="submit" onClick={handleLogout}>
              Logout
            </button>
          </form>
        </div>
      ) : (
        <a href="/login">Login</a>
      )}
    </div>
  );
}
