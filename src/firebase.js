// API client adapter — tries real backend first, falls back to mock auth when unavailable

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Mock user database (used when backend is unreachable) ─────────────────────
const MOCK_USERS = {
  "admin@school.com":    { uid: "mock-admin-001",    email: "admin@school.com",    name: "Admin User",       role: "admin",    password: "admin123" },
  "webadmin@school.com": { uid: "mock-webadmin-001", email: "webadmin@school.com", name: "Web Admin",        role: "webadmin", password: "webadmin123" },
  "teacher@school.com":  { uid: "mock-teacher-001",  email: "teacher@school.com",  name: "Teacher User",     role: "teacher",  password: "teacher123" },
  "parent@school.com":   { uid: "mock-parent-001",   email: "parent@school.com",   name: "Parent User",      role: "parent",   password: "parent123" },
};

const MOCK_TOKEN_PREFIX = "mock_token_";
const MOCK_MODE_KEY = "school_erp_mock_mode";

const getHeaders = () => {
  const token = sessionStorage.getItem("auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

// ── Check if backend is reachable ─────────────────────────────────────────────
const checkBackendReachable = async () => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${API_URL}/auth/me`, {
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
    });
    clearTimeout(t);
    return res.status !== 0; // any real HTTP response means backend is up
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export const auth = { isMock: false };
export const db   = { isMock: false };

let authListeners = [];
let currentUser   = null;

const notifyListeners = () => authListeners.forEach((cb) => cb(currentUser));

// ── Auto-restore session on page load ────────────────────────────────────────
const initAuth = async () => {
  const token      = sessionStorage.getItem("auth_token");
  const cachedUser = sessionStorage.getItem("school_erp_auth_user");

  if (!token || !cachedUser) return;

  currentUser = JSON.parse(cachedUser);
  notifyListeners(); // fire immediately with cached user

  // If mock token → no need to verify with backend
  if (token.startsWith(MOCK_TOKEN_PREFIX)) {
    return;
  }

  // Try to verify with real backend
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders(),
      signal: ctrl.signal,
    });
    if (res.ok) {
      const user = await res.json();
      currentUser = user;
      sessionStorage.setItem("school_erp_auth_user", JSON.stringify(currentUser));
      notifyListeners();
    } else {
      // Token invalid — log out
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("school_erp_auth_user");
      currentUser = null;
      notifyListeners();
    }
  } catch {
    // Backend unreachable — keep cached user (offline mode)
    console.warn("[Auth] Backend unreachable, using cached session.");
  }
};
initAuth();

// ── Sign In ───────────────────────────────────────────────────────────────────
export const signInWithEmailAndPassword = async (_authObj, email, password) => {
  const emailKey = email.trim().toLowerCase();

  // 1️⃣ Try real backend first
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 4000);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: ctrl.signal,
    });

    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("auth_token", data.token);
      sessionStorage.setItem("school_erp_auth_user", JSON.stringify(data.user));
      sessionStorage.removeItem(MOCK_MODE_KEY);
      currentUser = data.user;
      notifyListeners();
      return { user: currentUser };
    } else {
      // Backend is up but rejected credentials → real error
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Invalid email or password");
    }
  } catch (err) {
    // If it's a credential rejection (not a network error), rethrow
    if (err.message && !err.message.includes("fetch") && !err.message.includes("abort") && !err.message.includes("network") && !err.message.includes("Failed")) {
      throw err;
    }

    // 2️⃣ Backend unreachable → use mock auth
    console.warn("[Auth] Backend not reachable, using mock authentication.");

    const mockUser = MOCK_USERS[emailKey];
    if (!mockUser) {
      throw new Error("Invalid email or password");
    }
    if (mockUser.password !== password) {
      throw new Error("Invalid email or password");
    }

    // Create mock session
    const mockToken = `${MOCK_TOKEN_PREFIX}${mockUser.uid}_${Date.now()}`;
    const userObj = {
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.name,
      role: mockUser.role,
    };

    sessionStorage.setItem("auth_token", mockToken);
    sessionStorage.setItem("school_erp_auth_user", JSON.stringify(userObj));
    sessionStorage.setItem(MOCK_MODE_KEY, "true");
    currentUser = userObj;
    notifyListeners();
    return { user: currentUser };
  }
};

// ── Register ──────────────────────────────────────────────────────────────────
export const createUserWithEmailAndPassword = async (_authObj, email, password) => {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 4000);

    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Registration failed");
    }

    const data = await res.json();
    sessionStorage.setItem("auth_token", data.token);
    sessionStorage.setItem("school_erp_auth_user", JSON.stringify(data.user));
    currentUser = data.user;
    notifyListeners();
    return { user: currentUser };
  } catch (err) {
    if (err.message && !err.message.includes("fetch") && !err.message.includes("abort") && !err.message.includes("Failed")) {
      throw err;
    }
    throw new Error("Backend server not running. Please start the server on port 5000.");
  }
};

// ── Admin Create User ─────────────────────────────────────────────────────────
export const adminCreateUser = async (email, password, role = "teacher", extra = {}) => {
  const res = await fetch(`${API_URL}/auth/admin-create-user`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, password, role, ...extra }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to create user by admin");
  }
  return await res.json();
};

// ── Sign Out ──────────────────────────────────────────────────────────────────
export const signOut = async (_authObj) => {
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("school_erp_auth_user");
  sessionStorage.removeItem(MOCK_MODE_KEY);
  currentUser = null;
  notifyListeners();
};

// ── Auth State Observer ───────────────────────────────────────────────────────
export const onAuthStateChanged = (_authObj, callback) => {
  authListeners.push(callback);
  callback(currentUser); // fire immediately with current state
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx > -1) authListeners.splice(idx, 1);
  };
};

// ── Firestore API Simulation over REST ───────────────────────────────────────
export const doc = (_dbObj, collectionName, docId) => ({ collectionName, docId });
export const collection = (_dbObj, collectionName) => ({ collectionName, constraints: [] });
export const query = (colRef, ...constraints) => ({ ...colRef, constraints });
export const where = (field, op, value) => ({ type: "where", field, op, value });

export const getDoc = async (docRef) => {
  const { collectionName, docId } = docRef;
  const isMock = sessionStorage.getItem(MOCK_MODE_KEY) === "true";

  // In mock mode — synthesize user profile from sessionStorage
  if (isMock || (sessionStorage.getItem("auth_token") || "").startsWith(MOCK_TOKEN_PREFIX)) {
    const cached = sessionStorage.getItem("school_erp_auth_user");
    if (cached && collectionName === "users") {
      const u = JSON.parse(cached);
      return { exists: () => true, data: () => ({ uid: u.uid, email: u.email, name: u.displayName, role: u.role }) };
    }
    return { exists: () => false, data: () => null };
  }

  try {
    const res = await fetch(`${API_URL}/${collectionName}/${docId}`, { headers: getHeaders() });
    if (!res.ok) return { exists: () => false, data: () => null };
    const data = await res.json();
    return { exists: () => true, data: () => data };
  } catch {
    return { exists: () => false, data: () => null };
  }
};

export const setDoc = async (docRef, data) => {
  const isMock = (sessionStorage.getItem("auth_token") || "").startsWith(MOCK_TOKEN_PREFIX);
  if (isMock) return data; // No-op in mock mode

  const { collectionName, docId } = docRef;
  const res = await fetch(`${API_URL}/${collectionName}/${docId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to save document");
  }
  return await res.json();
};

export const updateDoc = async (docRef, data) => {
  const { collectionName, docId } = docRef;
  const res = await fetch(`${API_URL}/${collectionName}/${docId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update document");
  }
  return await res.json();
};

export const getDocs = async (queryOrColRef) => {
  const isMock = (sessionStorage.getItem("auth_token") || "").startsWith(MOCK_TOKEN_PREFIX);
  if (isMock) return { docs: [], empty: true }; // Empty lists in mock mode

  const { collectionName, constraints } = queryOrColRef;
  let url = `${API_URL}/${collectionName}`;
  if (constraints && constraints.length > 0) {
    const params = new URLSearchParams();
    constraints.forEach((c) => {
      if (c.type === "where" && c.op === "==") params.append(c.field, c.value);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch documents");
  const list = await res.json();
  return { docs: list.map((item) => ({ id: item.id, data: () => item })), empty: list.length === 0 };
};

export const addDoc = async (colRef, data) => {
  const { collectionName } = colRef;
  const res = await fetch(`${API_URL}/${collectionName}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to add document");
  }
  const saved = await res.json();
  return { id: saved.id };
};

export const isMockMode = false;
