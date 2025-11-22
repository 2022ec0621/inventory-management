import React, { useState } from "react";
import api from "./api"; 

function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await api.post(url, { username, password });
      onLogin(res.data); // { token, username, role }
    } catch (err) {
      console.error("Auth error:", err);
      const msg =
        err.response?.data?.error ||
        (isLogin ? "Login failed. Check credentials." : "Registration failed.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setMode("login");
    setError("");
  };

  const switchToRegister = () => {
    setMode("register");
    setError("");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-overlay" />

      <div className="auth-card">
        <h2 className="auth-title">{isLogin ? "Login" : "Register"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Username</label>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-button-primary"
            disabled={loading}
          >
            {loading
              ? isLogin
                ? "Logging in..."
                : "Creating account..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>
              New user?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={switchToRegister}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link-button"
                onClick={switchToLogin}
              >
                Login
              </button>
            </>
          )}
        </div>

        <div className="auth-demo">
          <p>Demo users:</p>
          <p>admin / admin123 (admin)</p>
          <p>client / client123 (client)</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
