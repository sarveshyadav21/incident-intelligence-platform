import { api } from "../../../lib/axios";

import { Incident } from "../types/incident.type";

export async function getIncidents() {
  const response = await api.get<{
    data: Incident[];
  }>("/incidents");

  return response.data.data;
}
