"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { ADMIN_ROUTES, BRAND_ASSETS } from "../../../lib/constants";
import { auth, db } from "../../../lib/firebaseConfig.js";

type AdminProfile = {
  role?: string;
  isActive?: boolean;
  email?: string;
  username?: string;
};

async function resolveLoginEmail(identifier: string) {
  const normalized = identifier.trim();

  if (!normalized) {
    return "";
  }

  if (normalized.includes("@")) {
    return normalized;
  }

  const snapshot = await getDocs(
    query(collection(db, "users"), where("username", "==", normalized), limit(1)),
  );

  if (snapshot.empty) {
    throw new Error("No admin account was found for that username.");
  }

  const userData = snapshot.docs[0]?.data() as AdminProfile | undefined;

  if (!userData?.email) {
    throw new Error("That username does not have a login email on file.");
  }

  return userData.email;
}

async function getAdminAccessState(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return false;
  }

  const userData = snapshot.data() as AdminProfile;
  const isAdmin = userData.role === "admin" || userData.role === "superadmin";
  return isAdmin && userData.isActive !== false;
}

function friendlyAuthError(code?: string): string | null {
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return null;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCheckingSession(false);
        return;
      }

      try {
        const isAllowed = await getAdminAccessState(user.uid);

        if (isAllowed) {
          router.replace(ADMIN_ROUTES.home);
          return;
        }

        await signOut(auth);
        setError("This account is not authorized for admin access.");
      } catch {
        setError("Unable to verify admin access right now.");
      } finally {
        setCheckingSession(false);
      }
    });

    return () => unsub();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const email = await resolveLoginEmail(identifier);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const isAllowed = await getAdminAccessState(credential.user.uid);

      if (!isAllowed) {
        await signOut(auth);
        throw new Error("This account is not authorized for admin access.");
      }

      router.replace(ADMIN_ROUTES.home);
    } catch (submitError) {
      const authMessage =
        submitError instanceof Error
          ? friendlyAuthError((submitError as { code?: string }).code) ?? submitError.message
          : "Unable to sign in. Please try again.";
      setError(authMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black px-6 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="relative h-14 w-14">
            <Image
              src={BRAND_ASSETS.logo}
              alt="MyHalftimeQuiz"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Login</h1>
          <p className="text-sm text-white/65">
            Sign in with an authorized admin email or username.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {checkingSession ? (
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/70">
            Checking current session...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Email or Username</span>
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="admin@example.com or adminuser"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/30 focus:bg-black/30"
                disabled={busy}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/30 focus:bg-black/30"
                disabled={busy}
                required
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
