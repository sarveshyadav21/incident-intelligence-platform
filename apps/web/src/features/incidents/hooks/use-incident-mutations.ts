"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  analyzeAndStoreIncident,
  analyzeIncidentLogs,
  createIncident,
  createIncidentFeedback,
  createRatingFeedback,
  deleteIncidentUpload,
  reanalyzeIncident,
  uploadIncidentFile,
} from "../api/incident-api";
import { useAnalysisJobsStore } from "../store/analysis-jobs.store";
import { incidentQueryKeys } from "./incident-query-keys";

import type {
  AnalyzeAndStoreInput,
  CreateFeedbackInput,
  CreateIncidentInput,
  CreateRatingFeedbackInput,
} from "../types/incident.type";

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIncidentInput) => createIncident(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentQueryKeys.list() });
      toast.success("Incident created");
    },
    onError: () => {
      toast.error("Failed to create incident");
    },
  });
}

export function useAnalyzeIncidentLogs() {
  return useMutation({
    mutationFn: (logs: string) => analyzeIncidentLogs(logs),
    onError: () => {
      toast.error("AI analysis failed");
    },
  });
}

export function useAnalyzeAndStoreIncident() {
  const queryClient = useQueryClient();
  const registerJob = useAnalysisJobsStore((state) => state.registerJob);

  return useMutation({
    mutationFn: (input: AnalyzeAndStoreInput) =>
      analyzeAndStoreIncident(input),
    onSuccess: (data) => {
      registerJob(data.jobId, data.incidentId);
      queryClient.invalidateQueries({ queryKey: incidentQueryKeys.list() });
      queryClient.invalidateQueries({
        queryKey: incidentQueryKeys.detail(data.incidentId),
      });
      toast.success("Incident queued for AI analysis");
    },
    onError: () => {
      toast.error("Failed to queue incident analysis");
    },
  });
}

export function useUploadIncidentFile(incidentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadIncidentFile(incidentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentQueryKeys.detail(incidentId),
      });
      toast.success("File uploaded");
    },
    onError: () => {
      toast.error("Upload failed");
    },
  });
}

export function useDeleteIncidentUpload(incidentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uploadId: string) =>
      deleteIncidentUpload(incidentId, uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentQueryKeys.detail(incidentId),
      });
      toast.success("Upload removed");
    },
  });
}

export function useCreateIncidentFeedback(incidentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFeedbackInput) =>
      createIncidentFeedback(incidentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentQueryKeys.detail(incidentId),
      });
      queryClient.invalidateQueries({ queryKey: incidentQueryKeys.list() });
      toast.success("Feedback saved");
    },
    onError: () => {
      toast.error("Failed to save feedback");
    },
  });
}

export function useCreateRatingFeedback(incidentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRatingFeedbackInput) =>
      createRatingFeedback(incidentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentQueryKeys.detail(incidentId),
      });
    },
  });
}

export function useReanalyzeIncident() {
  const queryClient = useQueryClient();
  const registerJob = useAnalysisJobsStore((state) => state.registerJob);

  return useMutation({
    mutationFn: (incidentId: string) => reanalyzeIncident(incidentId),
    onSuccess: (data) => {
      registerJob(data.jobId, data.incidentId);
      queryClient.invalidateQueries({
        queryKey: incidentQueryKeys.detail(data.incidentId),
      });
      queryClient.invalidateQueries({ queryKey: incidentQueryKeys.list() });
      toast.success("Re-analysis queued");
    },
    onError: () => {
      toast.error("Failed to queue re-analysis");
    },
  });
}
