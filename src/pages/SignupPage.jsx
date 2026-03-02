import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setSession } from "../features/auth/authSlice";
import { signup } from "../services/profileAuthApi";

export function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerCode: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [state, setState] = useState({ loading: false, error: "" });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "" });
    try {
      const response = await signup(form);
      dispatch(setSession({ token: response.token, profile: response.profile }));
      navigate("/cart");
    } catch (error) {
      setState({ loading: false, error: error.message || "Signup failed." });
      return;
    }
    setState({ loading: false, error: "" });
  };

  return (
    <section className="page auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <label>
          Customer Code
          <input
            required
            value={form.customerCode}
            onChange={(event) => handleChange("customerCode", event.target.value)}
          />
        </label>
        <label>
          Full Name
          <input
            required
            value={form.fullName}
            onChange={(event) => handleChange("fullName", event.target.value)}
          />
        </label>
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
          Phone
          <input
            value={form.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={6}
            required
            value={form.password}
            onChange={(event) => handleChange("password", event.target.value)}
          />
        </label>
        <button type="submit" disabled={state.loading}>
          {state.loading ? "Creating..." : "Sign Up"}
        </button>
        {state.error && <p className="error">{state.error}</p>}
        <p className="muted-copy">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </form>
    </section>
  );
}
