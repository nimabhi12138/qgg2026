import { http } from "@/api/http";

export type TokenOut = { access_token: string; token_type: string };

export async function apiLogin(username: string, password: string) {
  return (await http.post("/auth/login", { username, password })) as TokenOut;
}

