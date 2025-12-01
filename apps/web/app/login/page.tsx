"use client";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const loginGithub = () => {
    authClient.signIn.social({
      provider: "github",
      callbackURL: "http://localhost:3001/dashboard",
      errorCallbackURL: "http://localhost:3001/error",
      newUserCallbackURL: "http://localhost:3001/new-user",
    });
  };

  const loginTwitter = () => {
    authClient.signIn.social({
      provider: "twitter",
      callbackURL: "http://localhost:3001/dashboard",
      errorCallbackURL: "http://localhost:3001/error",
      newUserCallbackURL: "http://localhost:3001/new-user",
    });
  };

  const loginGoogle = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: "http://localhost:3001/dashboard",
      errorCallbackURL: "http://localhost:3001/error",
      newUserCallbackURL: "http://localhost:3001/new-user",
    });
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={loginGithub}>Login with GitHub</button>
      <br />
      <button onClick={loginTwitter}>Login with Twitter</button>
      <br />
      <button onClick={loginGoogle}>Login with Google</button>
    </div>
  );
}
