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
import { auth } from "../../lib/firebaseConfig";
import { getFirebaseConfigError } from "../../lib/firebase/client";

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
      router.replace("/");
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
      router.replace("/");
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
      router.replace("/");
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
      className="min-h-screen w-full relative flex items-start justify-center bg-black"
      style={{
        backgroundImage: "url('/sports-login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />

      <div className="relative w-full max-w-md mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="flex flex-col items-center mb-0">
          <img
            src="/HQ25_logo.png"
            alt="Halftime Quiz"
            className="w-60 h-60 drop-shadow-lg mb-0"
          />
        </div>
        <form
          onSubmit={handleLogin}
          className="bg-black/60 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10"
        >
          {error ? (
            <div className="mb-4 text-sm text-red-300">{error}</div>
          ) : null}

          <label className="block text-white text-sm mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 focus:border-white/40 outline-none px-4 py-3"
            placeholder="you@example.com"
            required
          />

          <label className="block text-white text-sm mb-1" htmlFor="password">
            Password
          </label>
          <div className="relative mb-4">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 focus:border-white/40 outline-none px-4 py-3 pr-12"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="flex items-center justify-between mb-5">
            <label className="flex items-center gap-2 text-white/80 text-sm">
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-3 mt-3 rounded-xl bg-green-600 text-white font-semibold shadow-lg hover:bg-green-500 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-white/20 flex-1" />
            <span className="text-white/60 text-xs">or</span>
            <div className="h-px bg-white/20 flex-1" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white/90 text-black font-semibold hover:bg-white"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
