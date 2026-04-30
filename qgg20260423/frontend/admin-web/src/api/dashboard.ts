import { http } from "@/api/http";
import type { DashboardSummary } from "@/types/models";

export async function apiGetDashboard() {
  return (await http.get("/dashboard")) as DashboardSummary;
}

