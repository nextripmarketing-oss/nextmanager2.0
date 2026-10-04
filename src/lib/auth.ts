// JWT-based Authentication Client

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: "Admin" | "Staff" | "Marketing Manager" | "Accountant";
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

const TOKEN_STORAGE_KEY = "auth_token";
const USER_STORAGE_KEY = "auth_user";

export const authClient = {
  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  // Get stored user
  getUser(): AuthUser | null {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Sign up with email and password
  async signup(email: string, password: string, displayName?: string): Promise<AuthUser> {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Signup failed");
    }

    const data = await res.json();
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  },

  // Login with email and password
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await res.json();
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  },

  // Logout
  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  },

  // Get current user from server
  async getCurrentUser(): Promise<AuthUser | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        this.logout();
        return null;
      }

      const user = await res.json();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  },

  // Reset password (email-based link)
  async resetPassword(email: string): Promise<void> {
    // This would require a backend implementation
    throw new Error("Password reset via email not yet implemented");
  },
};

