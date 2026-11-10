import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../utils/supabase";
import { checkIsAdmin } from "../config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [loading, setLoading] = useState(true);

  // Fetch role from Supabase 'profiles' table
  const fetchProfileRole = async (currentUser) => {
    if (!currentUser || !isSupabaseConfigured() || !supabase) {
      setUserRole("user");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!error && data?.role) {
        setUserRole(data.role.toLowerCase().trim());
      } else {
        // If profile doesn't exist yet, insert a default row
        const defaultRole = checkIsAdmin(currentUser.email) ? "admin" : "user";
        setUserRole(defaultRole);
        await supabase.from("profiles").upsert(
          {
            id: currentUser.id,
            email: currentUser.email,
            role: defaultRole,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }
    } catch (err) {
      console.warn("Could not fetch profile role, using config fallback:", err);
      setUserRole(checkIsAdmin(currentUser?.email) ? "admin" : "user");
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfileRole(currentUser);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfileRole(currentUser);
        } else {
          setUserRole("user");
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Admin check: true if database role is 'admin' OR if email matches admin list
  const isAdmin = Boolean(
    user && (userRole === "admin" || checkIsAdmin(user.email))
  );

  // Email / Password Login
  const signInWithEmail = async (email, password) => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error("Supabase is not configured yet. Please add your credentials to .env file.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    if (data?.user) {
      await fetchProfileRole(data.user);
    }
    return data;
  };

  // Email / Password Sign Up
  const signUpWithEmail = async (email, password, fullName = "") => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error("Supabase is not configured yet. Please add your credentials to .env file.");
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });
    if (error) throw error;
    if (data?.user) {
      await fetchProfileRole(data.user);
    }
    return data;
  };

  // Sign Out
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setUserRole("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRole,
        isAdmin,
        isConfigured: isSupabaseConfigured(),
        refreshRole: () => user && fetchProfileRole(user),
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
