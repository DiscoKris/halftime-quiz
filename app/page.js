'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebaseConfig";
import { getFirebaseConfigError } from "../lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!auth) {
        throw new Error(getFirebaseConfigError());
      }
      await setPersistence(
        auth,
        stayLoggedIn ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/choose");
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    setError("");
    setLoading(true);
    try {
      if (!auth) {
        throw new Error(getFirebaseConfigError());
      }
      await setPersistence(
        auth,
        stayLoggedIn ? browserLocalPersistence : browserSessionPersistence
      );
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/choose");
    } catch (err) {
      setError(err?.message || "Account creation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      if (!auth) {
        throw new Error(getFirebaseConfigError());
      }
      await setPersistence(
        auth,
        stayLoggedIn ? browserLocalPersistence : browserSessionPersistence
      );
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace("/choose");
    } catch (err) {
      setError(err?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setError("");
    if (!email) {
      setError("Enter your email to receive a reset link.");
      return;
    }
    try {
      if (!auth) {
        throw new Error(getFirebaseConfigError());
      }
      await sendPasswordResetEmail(auth, email.trim());
      setError("Password reset email sent.");
    } catch (err) {
      setError(err?.message || "Could not send reset email.");
    }
  }

  return (
    <main
      className="relative flex min-h-screen w-full items-start justify-center bg-black"
      style={{
        backgroundImage: "url('/sports-login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />

      <div className="relative mx-auto w-full max-w-md px-4 pb-12 pt-24 sm:px-6">
        <div className="mb-0 flex flex-col items-center">
          <img
            src="/HQ25_logo.png"
            alt="Halftime Quiz"
            className="mb-0 h-60 w-60 drop-shadow-lg"
          />
        </div>
        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-white/10 bg-black/60 p-6 shadow-xl backdrop-blur-md"
        >
          {error ? (
            <div className="mb-4 text-sm text-red-300">{error}</div>
          ) : null}

          <label className="mb-1 block text-sm text-white" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 outline-none focus:border-white/40"
            placeholder="you@example.com"
            required
          />

          <label className="mb-1 block text-sm text-white" htmlFor="password">
            Password
          </label>
          <div className="relative mb-4">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white placeholder-white/60 outline-none focus:border-white/40"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/70 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="mb-5 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={stayLoggedIn}
                onChange={(e) => setStayLoggedIn(e.target.checked)}
                className="accent-white"
              />
              Stay signed in
            </label>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-purple-300 hover:text-purple-200"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 py-3 font-semibold text-white shadow-lg hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            className="mt-3 w-full rounded-xl bg-green-600 py-3 font-semibold text-white shadow-lg hover:bg-green-500 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/20" />
            <span className="text-xs text-white/60">or</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full rounded-xl bg-white/90 py-3 font-semibold text-black hover:bg-white"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
