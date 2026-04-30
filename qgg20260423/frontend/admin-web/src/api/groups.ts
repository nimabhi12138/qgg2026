import { http } from "@/api/http";
import type { Group, GroupCreate, GroupRuleBind, GroupRuleBindCreate } from "@/types/models";

export async function apiListGroups() {
  return (await http.get("/groups")) as Group[];
}

export async function apiCreateGroup(payload: GroupCreate) {
  return (await http.post("/groups", payload)) as Group;
}

export async function apiListGroupRules(groupId: number) {
  return (await http.get(`/groups/${groupId}/rules`)) as GroupRuleBind[];
}

export async function apiBindRuleToGroup(groupId: number, payload: GroupRuleBindCreate) {
  return (await http.post(`/groups/${groupId}/rules`, payload)) as GroupRuleBind;
}

export async function apiUnbindRuleFromGroup(groupId: number, ruleId: number) {
  return (await http.delete(`/groups/${groupId}/rules/${ruleId}`)) as { deleted: boolean };
}

