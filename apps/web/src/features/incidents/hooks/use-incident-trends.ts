import { useQuery } from "@tanstack/react-query";

import { getIncidentTrends } from "../api/get-incident-trends";

export function useIncidentTrends() {
  return useQuery({
    queryKey: ["incident-trends"],

    queryFn: getIncidentTrends,
  });
}
