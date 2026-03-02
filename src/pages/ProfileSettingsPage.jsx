import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { setSession } from "../features/auth/authSlice";
import { changePassword, updateProfile } from "../services/profileAuthApi";

export function ProfileSettingsPage() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const profile = useSelector((state) => state.auth.profile);
  const [form, setForm] = useState({
    customerCode: profile?.customerCode || "",
    fullName: profile?.fullName || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [state, setState] = useState({
    loading: false,
    success: "",
    error: "",
  });
  const [passwordState, setPasswordState] = useState({
    loading: false,
    success: "",
    error: "",
  });

  if (!profile) {
    return (
      <section className="page">
        <h1>Profile Settings</h1>
        <p>
          Please <Link to="/signin">sign in</Link> to update your profile.
        </p>
      </section>
    );
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState({ loading: true, success: "", error: "" });
    try {
      const updated = await updateProfile(profile.id, form);
      dispatch(setSession({ token, profile: updated }));
      setState({
        loading: false,
        success: "Profile updated successfully.",
        error: "",
      });
    } catch (error) {
      setState({
        loading: false,
        success: "",
        error: error.message || "Failed to update profile.",
      });
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordState({ loading: true, success: "", error: "" });
    try {
      await changePassword(profile.id, passwordForm);
      setPasswordState({
        loading: false,
        success: "Password changed successfully.",
        error: "",
      });
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (error) {
      setPasswordState({
        loading: false,
        success: "",
        error: error.message || "Failed to change password.",
      });
    }
  };

  return (
    <section className="page profile-shell">
      <div className="profile-hero">
        <h1>Profile Settings</h1>
        <p className="muted-copy">
          Manage your account details and keep your password secure.
        </p>
      </div>
      <div className="settings-grid">
        <form className="settings-card" onSubmit={handleSubmit}>
          <h2>Account Details</h2>
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
          <button type="submit" disabled={state.loading}>
            {state.loading ? "Saving..." : "Save Changes"}
          </button>
          {state.success && <p className="success-msg">{state.success}</p>}
          {state.error && <p className="error">{state.error}</p>}
        </form>
        <form className="settings-card security-card" onSubmit={handlePasswordSubmit}>
          <h2>Change Password</h2>
          <label>
            Current Password
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(event) =>
                handlePasswordChange("currentPassword", event.target.value)
              }
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(event) =>
                handlePasswordChange("newPassword", event.target.value)
              }
            />
          </label>
          <button type="submit" disabled={passwordState.loading}>
            {passwordState.loading ? "Changing..." : "Change Password"}
          </button>
          {passwordState.success && (
            <p className="success-msg">{passwordState.success}</p>
          )}
          {passwordState.error && <p className="error">{passwordState.error}</p>}
        </form>
      </div>
    </section>
  );
}
