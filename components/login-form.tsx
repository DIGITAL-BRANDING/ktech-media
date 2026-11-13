"use client";

import { useActionState } from "react";
import { loginWithPassword, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginWithPassword, initialState);
  return (
    <form action={action} className="editor-form login-form">
      <label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Kalmar sirri<input name="password" type="password" autoComplete="current-password" required /></label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="btn-waraka-primary" type="submit" disabled={pending}>{pending ? "Ana shiga…" : "Shiga newsroom"}</button>
    </form>
  );
}
