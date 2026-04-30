import { http } from "@/api/http";
import type { Publish } from "@/types/models";

export async function apiListPublishes() {
  return (await http.get("/publishes")) as Publish[];
}

export async function apiTransitionPublish(publishId: number, toStatus: "rolling_out" | "published") {
  return (await http.post(`/publishes/${publishId}/transition`, { to_status: toStatus })) as Publish;
}

