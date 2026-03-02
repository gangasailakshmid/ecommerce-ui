import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "ecommerce_auth_session";

function loadSession() {
  if (typeof window === "undefined") {
    return { token: null, profile: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { token: null, profile: null };
    }
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || null,
      profile: parsed?.profile || null,
    };
  } catch (_error) {
    return { token: null, profile: null };
  }
}

function saveSession(session) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

const initialSession = loadSession();

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: initialSession.token,
    profile: initialSession.profile,
  },
  reducers: {
    setSession: (state, action) => {
      state.token = action.payload.token;
      state.profile = action.payload.profile;
      saveSession({ token: state.token, profile: state.profile });
    },
    logout: (state) => {
      state.token = null;
      state.profile = null;
      clearSession();
    },
  },
});

export const { setSession, logout } = authSlice.actions;
export default authSlice.reducer;
