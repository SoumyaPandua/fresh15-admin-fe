import { API_BASE_URL } from "./auth";

export type ProfileUser = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  portal?: string;
  profileImage?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
};

export type ProfileDetails = {
  _id?: string;
  userId?: string;
  role?: string;
  avatar?: string;
  gender?: string;
  dob?: string;
  designation?: string;
  notificationSettings?: { email?: boolean; push?: boolean };
};

export type ProfilePayload = { user: ProfileUser; profile: ProfileDetails };

type ApiResponse<T> = { success: boolean; message?: string; data: T };

async function request<T>(
  path: string,
  init: RequestInit,
  token: string | null,
): Promise<ApiResponse<T>> {
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("Unable to reach the server. Please check your connection and try again.");
  }
  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return json as ApiResponse<T>;
}

export function getProfile(token: string | null) {
  return request<ProfilePayload>("/api/profile", { method: "GET" }, token);
}

export type UpdateProfileInput = {
  name: string;
  email: string;
  phone: string;
  gender?: string;
  dob?: string;
  designation?: string;
  notificationSettings: { email: boolean; push: boolean };
};

export function updateProfile(input: UpdateProfileInput, token: string | null) {
  return request<ProfilePayload>(
    "/api/profile",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    token,
  );
}

export function updateAvatar(file: File, token: string | null) {
  const fd = new FormData();
  fd.append("image", file);
  // Never set Content-Type manually for multipart/form-data.
  return request<{ profileImage?: string; avatar?: string; profile?: ProfileDetails }>(
    "/api/profile/avatar",
    { method: "PATCH", body: fd },
    token,
  );
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
  token: string | null,
) {
  return request<null>(
    "/api/profile/password",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    token,
  );
}
