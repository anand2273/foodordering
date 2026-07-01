import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiErrorMessage } from "../api/client";
import { login } from "../api/foodapp";
import { useAuth } from "../context/AuthContext";

export function MerchantLoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(username, password);
      await auth.refresh();
      void navigate("/merchant/orders", { replace: true });
    } catch (caught) {
      setError(apiErrorMessage(caught, "Login failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <form
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg"
        onSubmit={(event) => void submit(event)}
      >
        <p className="text-sm font-bold uppercase tracking-wider text-amber-700">
          Merchant portal
        </p>
        <h1 className="mt-2 text-2xl font-black">Sign in</h1>
        <label className="mt-6 block text-sm font-medium">
          Username
          <input
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
