import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setSession } from "../features/auth/authSlice";
import { signin } from "../services/profileAuthApi";

export function SigninPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [state, setState] = useState({ loading: false, error: "" });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "" });
    try {
      const response = await signin(form);
      dispatch(setSession({ token: response.token, profile: response.profile }));
      navigate("/cart");
    } catch (error) {
      setState({ loading: false, error: error.message || "Signin failed." });
      return;
    }
    setState({ loading: false, error: "" });
  };

  return (
    <section className="page auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Sign In</h1>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) => handleChange("password", event.target.value)}
          />
        </label>
        <button type="submit" disabled={state.loading}>
          {state.loading ? "Signing In..." : "Sign In"}
        </button>
        {state.error && <p className="error">{state.error}</p>}
        <p className="muted-copy">
          New user? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </section>
  );
}
