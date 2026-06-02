import { api } from "../../../lib/axios";

export async function getIncidentTrends() {
  const response = await api.get("/incidents/analytics/trends");

  return response.data.data;
}
