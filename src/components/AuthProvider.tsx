import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authClient, AuthUser } from "../lib/auth";
import { UserProfile } from "../types/user";
import { UserService } from "../services/userService";

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth session on mount
    const initAuth = async () => {
      const storedUser = authClient.getUser();
      if (storedUser) {
        setUser(storedUser);
        // Verify token is still valid
        const currentUser = await authClient.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Load user profile
          UserService.ensureUserProfile(
            currentUser.uid,
            currentUser.email,
            currentUser.displayName,
          )
            .then((userProfile) => {
              setProfile(userProfile);
            })
            .catch((error) => {
              console.error("Error ensuring user profile:", error);
            });
        } else {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const authUser = await authClient.login(email, pass);
    setUser(authUser);
    // Load user profile
    const userProfile = await UserService.ensureUserProfile(
      authUser.uid,
      authUser.email,
      authUser.displayName,
    );
    setProfile(userProfile);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    const authUser = await authClient.signup(email, pass);
    setUser(authUser);
    // Load user profile
    const userProfile = await UserService.ensureUserProfile(
      authUser.uid,
      authUser.email,
      authUser.displayName,
    );
    setProfile(userProfile);
  };

  const resetPassword = async (email: string) => {
    await authClient.resetPassword(email);
  };

  const logout = async () => {
    await authClient.logout();
    setUser(null);
    setProfile(null);
  };

  const isAdmin =
    profile?.role === "Admin" || user?.role === "Admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        loginWithEmail,
        signUpWithEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

