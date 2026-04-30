import { http } from "@/api/http";
import type { Rule, RuleUpsert } from "@/types/models";

export async function apiListRules() {
  return (await http.get("/rules")) as Rule[];
}

export async function apiCreateRule(payload: RuleUpsert) {
  return (await http.post("/rules", payload)) as Rule;
}

export async function apiUpdateRule(ruleId: number, payload: RuleUpsert) {
  return (await http.put(`/rules/${ruleId}`, payload)) as Rule;
}

export async function apiDeleteRule(ruleId: number) {
  return (await http.delete(`/rules/${ruleId}`)) as { deleted: boolean };
}

