import { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession, logout as logoutRequest } from "../api/foodapp";

interface AuthContextValue {
  authenticated: boolean;
  loading: boolean;
  username?: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
    staleTime: 60_000,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated: session.isSuccess,
      loading: session.isLoading,
      username: session.data?.username,
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: ["session"] });
      },
      logout: async () => {
        await logoutRequest();
        queryClient.setQueryData(["session"], undefined);
        await queryClient.invalidateQueries({ queryKey: ["session"] });
      },
    }),
    [queryClient, session.data?.username, session.isLoading, session.isSuccess],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
