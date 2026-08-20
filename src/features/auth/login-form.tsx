"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form className="login-form" action={formAction}>
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Senha
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
