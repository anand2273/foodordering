import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isMerchantLoggedIn, setIsMerchantLoggedIn] = useState(() => {
    return !!localStorage.getItem("accessToken");
  });

  const login = (accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    setIsMerchantLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsMerchantLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isMerchantLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
