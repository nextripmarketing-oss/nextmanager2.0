import React, { useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  Plane,
  LogIn,
  Mail,
  Lock,
  Loader2,
  UserPlus,
  KeyRound,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Login() {
  const { login, loginWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [isEmailView, setIsEmailView] = useState(false);
  const [emailMode, setEmailMode] = useState<"login" | "register" | "forgot">(
    "login",
  );

  const normalizeEmail = (input: string): string => {
    const norm = input.trim().toLowerCase();
    if (norm === "admin@123") return "admin@123.com";
    if (norm === "m@123") return "m@123.com";
    if (norm === "account@123") return "account@123.com";
    if (norm.includes("@") && !norm.includes(".")) {
      return `${norm}.com`;
    }
    return norm;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    const targetEmail = normalizeEmail(email);

    try {
      if (emailMode === "login") {
        if (!password) throw new Error("Password is required");
        try {
          await loginWithEmail(targetEmail, password);
        } catch (err: any) {
          const isSeedAccount =
            (targetEmail === "admin@123.com" && password === "Nextrip@123") ||
            (targetEmail === "m@123.com" && password === "Mar@123") ||
            (targetEmail === "account@123.com" && password === "Account@123");

          if (isSeedAccount) {
            setSuccessMsg("Initializing secure seed account credentials...");
            try {
              await signUpWithEmail(targetEmail, password);
              setSuccessMsg("Seed account initialized! Authenticating...");
              await loginWithEmail(targetEmail, password);
            } catch (signUpErr: any) {
              // If signup fails because email already exists, it means the password provided was wrong.
              if (signUpErr.code === "auth/email-already-in-use") {
                throw new Error(
                  "Incorrect credentials. Please verify your password.",
                );
              }
              throw signUpErr;
            }
          } else {
            throw err;
          }
        }
      } else if (emailMode === "register") {
        if (!password) throw new Error("Password is required");
        if (password.length < 6)
          throw new Error("Password must be at least 6 characters long");
        await signUpWithEmail(targetEmail, password);
        setSuccessMsg("Account registered successfully! Logging you in...");
      } else if (emailMode === "forgot") {
        await resetPassword(targetEmail);
        setSuccessMsg("Password reset link sent! Check your inbox.");
      }
    } catch (err: any) {
      setError(err.message || "Authentication operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Mesh Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-blue-200/40 to-indigo-100/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-emerald-100/30 to-blue-200/40 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-100/20 blur-[80px] pointer-events-none animate-pulse duration-[8s]" />

      {/* Subtle Dot Matrix Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.06)] relative z-10"
      >
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="p-3 bg-white/80 rounded-2xl shadow-sm border border-slate-100"
            >
              <img
                src="/src/assets/images/nextrip_logo_1779094935437.png"
                alt="NexTrip Logo"
                className="h-16 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.35em] text-blue-600 font-extrabold mb-1.5 font-display">
                NexTrip System Access
              </p>
              <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight">
                Security Gateway
              </h1>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100" />

          <AnimatePresence mode="wait">
            {!isEmailView ? (
              <motion.div
                key="choice"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="w-full space-y-4"
              >
                <motion.button
                  whileHover={{
                    y: -2,
                    boxShadow: "0 10px 20px -10px rgba(0,0,0,0.08)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={login}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200/90 text-slate-800 py-4 px-6 rounded-2xl font-bold uppercase text-xs tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer font-sans"
                >
                  <img
                    src="https://www.google.com/favicon.ico"
                    className="w-4 h-4"
                    alt="G"
                  />
                  Continue with Google
                </motion.button>
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    or securely use
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <motion.button
                  whileHover={{
                    y: -2,
                    boxShadow: "0 12px 24px -10px rgba(15,23,42,0.15)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEmailView(true);
                    setEmailMode("login");
                  }}
                  className="w-full bg-slate-900 text-white py-4 px-6 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 cursor-pointer font-sans"
                >
                  <Mail size={16} strokeWidth={2.5} />
                  Staff Account Key
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSubmit}
                className="w-full space-y-4"
              >
                {/* Dynamic Header tabs */}
                <div className="flex border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode("login");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className={`flex-1 pb-2 text-center text-xs font-bold uppercase tracking-wider transition-colors ${emailMode === "login" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode("register");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className={`flex-1 pb-2 text-center text-xs font-bold uppercase tracking-wider transition-colors ${emailMode === "register" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode("forgot");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className={`flex-1 pb-2 text-center text-xs font-bold uppercase tracking-wider transition-colors ${emailMode === "forgot" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="relative group/input">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"
                      size={18}
                    />
                    <input
                      type="email"
                      placeholder="Agency Email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>

                  {emailMode !== "forgot" && (
                    <div className="relative group/input">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"
                        size={18}
                      />
                      <input
                        type="password"
                        placeholder={
                          emailMode === "register"
                            ? "Pick a Password (6+ chars)"
                            : "Access Token / Password"
                        }
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm text-slate-800 placeholder-slate-400 font-medium"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center"
                  >
                    {error}
                  </motion.p>
                )}

                {successMsg && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center"
                  >
                    {successMsg}
                  </motion.p>
                )}

                <div className="pt-2 space-y-3">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={
                      !loading
                        ? {
                            y: -2,
                            boxShadow: "0 12px 24px -10px rgba(37,99,235,0.25)",
                          }
                        : {}
                    }
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/10 cursor-pointer font-sans"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : emailMode === "login" ? (
                      <>
                        <LogIn size={16} strokeWidth={2.5} />
                        Authorize Session
                      </>
                    ) : emailMode === "register" ? (
                      <>
                        <UserPlus size={16} strokeWidth={2.5} />
                        Register Account
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} strokeWidth={2.5} />
                        Send Reset Email
                      </>
                    )}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setIsEmailView(false)}
                    className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors py-1 cursor-pointer font-sans"
                  >
                    Back to options
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] text-emerald-700 uppercase font-black tracking-widest font-sans">
                Secure Protocol Enabled
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
