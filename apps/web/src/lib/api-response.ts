import type { AxiosResponse } from "axios";

export type ApiResponse<T> = {
  success: boolean;
  timestamp: string;
  data: T;
};

export function unwrapApiData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data;
}
