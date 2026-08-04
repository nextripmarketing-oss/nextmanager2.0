import React, { useState, useEffect } from "react";
import { UserService } from "../services/userService";
import { UserProfile, UserRole } from "../types/user";
import {
  Shield,
  Users,
  Key,
  CheckSquare,
  Square,
  Save,
  Loader2,
  RefreshCw,
  Eye,
  Check,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StaffManagementProps {
  currentUserId: string;
}

export default function StaffManagement({
  currentUserId,
}: StaffManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const refreshUsers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await UserService.getAllUserProfiles();
      setUsers(data);
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const handleUpdate = async (
    uid: string,
    updatedRole: UserRole,
    updatedTabs: string[],
    mappedAgentName?: string
  ) => {
    setSaving(uid);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updates: Partial<UserProfile> = {
        role: updatedRole,
        allowedTabs: updatedTabs,
      };
      if (updatedRole === "Agent") {
        updates.mappedAgentName = mappedAgentName || "";
      } else {
        updates.mappedAgentName = "";
      }

      await UserService.updateUserProfile(uid, updates);

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? { ...u, role: updatedRole, allowedTabs: updatedTabs, mappedAgentName: updates.mappedAgentName }
            : u,
        ),
      );
      if (selectedUser && selectedUser.uid === uid) {
        setSelectedUser({
          ...selectedUser,
          role: updatedRole,
          allowedTabs: updatedTabs,
          mappedAgentName: updates.mappedAgentName,
        });
      }
      setSuccessMsg("Permissions and role successfully synchronized!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Failed to update privileges.");
    } finally {
      setSaving(null);
    }
  };

  const tabsConfig = [
    { id: "dashboard", label: "Executive Dashboard (ড্যাশবোর্ড)" },
    { id: "passengers", label: "Passenger Database (যাত্রী তালিকা)" },
    { id: "employment", label: "Employment Office (স্টাফ ও বেতন)" },
    { id: "ledger", label: "Financial Ledger (হিসাবের খাতা)" },
    { id: "agency", label: "Agency & Passport (এজেন্সি ও পাসপোর্ট)" },
    { id: "documents", label: "AI Documents Hub (ডকুমেন্ট ও ফটো এআই)" },
    { id: "settings", label: "System Settings (সেটিংস)" },
  ];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "Marketing Manager":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Accountant":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-base md:text-lg flex items-center gap-2">
            <Shield className="text-blue-600" size={20} />
            Staff Security Hub & Access Control
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Configure system roles and grant custom view approvals for specific
            modules.
          </p>
        </div>
        <button
          onClick={refreshUsers}
          disabled={loading}
          className="p-2.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh Directory"}
        </button>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2"
          >
            <Check size={16} />
            {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Directory List */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Registered System Staff
          </h4>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/50 rounded-3xl gap-3">
              <Loader2 className="text-blue-600 animate-spin" size={32} />
              <p className="text-slate-500 text-xs uppercase tracking-widest font-black">
                Scanning credentials directory...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/50 rounded-3xl text-center p-6">
              <Users className="text-slate-350 mb-3" size={40} />
              <p className="text-slate-800 font-bold text-sm">
                No other system users found.
              </p>
              <p className="text-slate-500 text-xs max-w-sm mt-1 leading-relaxed">
                When other staff sign in with their credentials, their profiles
                will automatically register here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const isSelected = selectedUser?.uid === u.uid;
                const isSelf = u.uid === currentUserId;
                const allowedCount = u.allowedTabs?.length || 0;

                return (
                  <motion.div
                    key={u.uid}
                    layoutId={`user-card-${u.uid}`}
                    onClick={() => setSelectedUser(u)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden bg-white ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-500/10 shadow-lg"
                        : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-display font-semibold text-slate-700 uppercase shrink-0">
                        {u.displayName?.slice(0, 2) ||
                          u.email?.slice(0, 2) ||
                          "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 text-sm truncate capitalize">
                            {u.displayName || u.email.split("@")[0]}
                          </p>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[8px] font-bold uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 self-end sm:self-auto shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                          APPROVED VIEWS
                        </p>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">
                          {u.role === "Admin"
                            ? "All (Bypassed)"
                            : `${allowedCount} of 7 Tabs`}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border rounded-lg ${getRoleBadgeColor(u.role)}`}
                      >
                        {u.role}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected User Permissions Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedUser ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-md space-y-6 sticky top-24"
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        Permission Approvals
                      </h4>
                      <h3 className="font-display font-extrabold text-slate-900 text-base mt-0.5 truncate capitalize">
                        {selectedUser.displayName ||
                          selectedUser.email.split("@")[0]}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-slate-450 hover:text-slate-700 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="h-px bg-slate-100 my-4" />
                </div>

                {/* Role Switcher */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Assign Core Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        "Admin",
                        "Marketing Manager",
                        "Accountant",
                        "Staff",
                        "Agent",
                      ] as UserRole[]
                    ).map((r) => {
                      const isActive = selectedUser.role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setSelectedUser({ ...selectedUser, role: r });
                          }}
                          className={`py-2.5 px-3 border rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                            isActive
                              ? "bg-slate-900 text-white border-slate-900 shadow-md"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedUser.role === "Agent" && (
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Map to Agency (Agency Partner Name)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800"
                      placeholder="e.g. NexTrip Partners"
                      value={selectedUser.mappedAgentName || ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          mappedAgentName: e.target.value,
                        })
                      }
                    />
                    <p className="text-[9px] text-slate-500 font-medium">
                      The name entered here must match the <b>Agent Name</b> or <b>Reference Name</b> in passenger profiles.
                    </p>
                  </div>
                )}

                {/* Tab Switcher */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Tab Display Controls
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Check the tabs this staff member is authorized to see:
                    </p>
                  </div>

                  {selectedUser.role === "Admin" ? (
                    <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs text-rose-800 leading-relaxed font-medium">
                      🛡️ <strong>Admin</strong> role automatically bypasses all
                      tab locks. This user has absolute view and edit access
                      across all modules.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tabsConfig.map((t) => {
                        const currentTabs = selectedUser.allowedTabs || [];
                        const isChecked = currentTabs.includes(t.id);

                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              const nextAllowed = isChecked
                                ? currentTabs.filter((id) => id !== t.id)
                                : [...currentTabs, t.id];
                              setSelectedUser({
                                ...selectedUser,
                                allowedTabs: nextAllowed,
                              });
                            }}
                            className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? "bg-blue-50/20 border-blue-200 text-blue-950 font-bold"
                                : "bg-white border-slate-100 hover:bg-slate-50/50 text-slate-600"
                            }`}
                          >
                            <span className="text-xs transition-colors">
                              {t.label}
                            </span>
                            <button type="button" className="text-blue-600">
                              {isChecked ? (
                                <CheckSquare size={18} />
                              ) : (
                                <Square className="text-slate-300" size={18} />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={() =>
                      handleUpdate(
                        selectedUser.uid,
                        selectedUser.role,
                        selectedUser.allowedTabs || [],
                        selectedUser.mappedAgentName
                      )
                    }
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/10 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {saving === selectedUser.uid ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Synchronizing...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Permitted Views
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center py-24">
                <Shield className="text-slate-300 mb-2" size={32} />
                <h5 className="font-bold text-slate-850 text-xs uppercase tracking-widest">
                  Select Staff Member
                </h5>
                <p className="text-slate-450 text-[11px] max-w-[200px] mt-1.5 leading-relaxed font-light">
                  Click on any staff registry item on the left to configure
                  their approval status and view privileges.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
