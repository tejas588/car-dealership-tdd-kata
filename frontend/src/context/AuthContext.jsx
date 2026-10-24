import { createContext, useContext, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("torque_user"));
    } catch {
      return null;
    }
  });

  async function authenticate(path, details) {
    const { data } = await api.post(`/auth/${path}`, details);
    localStorage.setItem("torque_token", data.token);
    localStorage.setItem("torque_user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem("torque_token");
    localStorage.removeItem("torque_user");
    setUser(null);
  }

  async function register(values) {
    await api.post("/auth/register", values);
    return authenticate("login", {
      email: values.email,
      password: values.password,
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login: (values) => authenticate("login", values),
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
