import { api } from "@/lib/axios";
import type { AuthSession, AuthUser } from "@/lib/auth";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export async function signup(input: {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const response = await api.post<ApiResponse<AuthSession>>("/auth/signup", input);
  return response.data.data;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const response = await api.post<ApiResponse<AuthSession>>("/auth/login", input);
  return response.data.data;
}

export async function guestLogin(): Promise<AuthSession> {
  const response = await api.post<ApiResponse<AuthSession>>("/auth/guest");
  return response.data.data;
}

export async function googleLogin(credential: string): Promise<AuthSession> {
  const response = await api.post<ApiResponse<AuthSession>>("/auth/google", {
    credential,
  });
  return response.data.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function fetchMe(): Promise<AuthUser> {
  const response = await api.get<ApiResponse<AuthUser>>("/auth/me");
  return response.data.data;
}
