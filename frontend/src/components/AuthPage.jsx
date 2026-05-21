// src/components/AuthPage.jsx
import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AUTH_API_URL = "http://localhost:5000/api/auth";

export default function AuthPage({ onAuthSuccess }) {
  const [showAuth, setShowAuth] = useState(false); // ⚡ Handles Landing vs Auth view toggle
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    const endpoint = isSignUp ? "/register" : "/login";

    try {
      const response = await axios.post(`${AUTH_API_URL}${endpoint}`, {
        email: email.trim(),
        password: password,
      });

      const { token } = response.data;
      localStorage.setItem("supabase_session_token", token);

      toast.success(isSignUp ? "Account initialized!" : "Welcome back!");
      onAuthSuccess();
    } catch (error) {
      console.error("Auth transaction failed:", error);
      toast.error(
        error.response?.data?.error || "Authentication transaction failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${AUTH_API_URL}/guest`);
      const { token } = response.data;

      localStorage.setItem("supabase_session_token", token);
      toast.success("Logged in as Guest Workspace Developer!");
      onAuthSuccess();
    } catch (error) {
      console.error("Guest profile token lookup failure:", error);
      toast.error("Could not initialize guest environment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Cyber-Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none select-none" />

      {!showAuth ? (
        /* 🪐 STATE A: THE NICE LANDING PAGE 🪐 */
        <div className="w-full max-w-4xl text-center flex flex-col items-center z-10 animate-in fade-in zoom-in-95 duration-500">
          {/* Decorative Animated Tech Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-indigo-300 uppercase">
              Powered by Node.js + Supabase
            </span>
          </div>

          {/* Main Hero Hook Statement */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-2xl leading-[1.15]">
            Streamline Your Focus. <br />
            Master Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Workspace.
            </span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-xl mt-6 leading-relaxed">
            LexiBoard brings high-performance task management to your pipeline.
            Drag cards, isolate column vectors, and organize project sprints
            seamlessly.
          </p>

          {/* ⚡ THE HERO "GET STARTED" CALL-TO-ACTION BUTTON ⚡ */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            <button
              onClick={() => setShowAuth(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-xl hover:shadow-indigo-500/20 transition-all duration-200 active:scale-95 group cursor-pointer"
            >
              Get Started Free
              <span className="inline-block transform group-hover:translate-x-1 transition-transform ml-2">
                →
              </span>
            </button>
          </div>

          {/* Mini Interactive Board Preview Silhouette */}
          <div className="mt-16 w-full bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 shadow-2xl backdrop-blur-sm opacity-60 flex gap-4 overflow-hidden h-40 select-none pointer-events-none hidden sm:flex">
            <div className="w-1/3 bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <div className="h-3 w-12 bg-indigo-500/20 rounded" />
              <div className="h-10 bg-slate-950 border border-slate-850 rounded-lg" />
              <div className="h-10 bg-slate-950 border border-slate-850 rounded-lg" />
            </div>
            <div className="w-1/3 bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <div className="h-3 w-16 bg-amber-500/20 rounded" />
              <div className="h-10 bg-slate-950 border border-slate-850 rounded-lg" />
            </div>
            <div className="w-1/3 bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <div className="h-3 w-10 bg-emerald-500/20 rounded" />
              <div className="h-10 bg-slate-950 border border-slate-850 rounded-lg" />
            </div>
          </div>
        </div>
      ) : (
        /* 🔑 STATE B: THE LOGIN / REGISTRATION CARD SYSTEM 🔑 */
        <div className="w-full max-w-md bg-slate-950 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-8 duration-300">
          {/* Back button to return to Hero Canvas */}
          <button
            onClick={() => setShowAuth(false)}
            className="absolute top-5 left-5 text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1.5 transition-colors focus:outline-none group"
            disabled={loading}
          >
            <span className="transform group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>{" "}
            Back
          </button>

          {/* Glowing Header Accent Strip */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.5)]" />

          <div className="text-center mb-8 mt-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-400">
              LexiBoard
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 uppercase tracking-wider font-medium">
              {isSignUp
                ? "Create a Secure Workspace"
                : "Access Personal Workspace Pipeline"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500/80 rounded-xl p-3 text-sm text-white focus:outline-none transition-colors shadow-inner"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500/80 rounded-xl p-3 text-sm text-white focus:outline-none transition-colors shadow-inner"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md mt-2 text-sm text-center cursor-pointer"
            >
              {loading
                ? "Authenticating Session..."
                : isSignUp
                  ? "Sign Up Workspace"
                  : "Log In"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs">
            <span className="text-slate-500">
              {isSignUp
                ? "Already have a project registry? "
                : "New to this pipeline? "}
            </span>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors focus:outline-none cursor-pointer"
              disabled={loading}
            >
              {isSignUp ? "Log In" : "Create Account"}
            </button>
          </div>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <span className="relative bg-slate-950 px-3 text-[10px] uppercase text-slate-500 tracking-widest font-bold">
              Or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full group relative flex items-center justify-center gap-2 p-3 text-sm text-indigo-400 hover:text-white border border-dashed border-indigo-500/20 hover:border-indigo-400/50 rounded-xl transition-all bg-indigo-950/5 hover:bg-indigo-600 font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] cursor-pointer"
          >
            Explore LexiBoard as Guest
            <span className="transform group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
