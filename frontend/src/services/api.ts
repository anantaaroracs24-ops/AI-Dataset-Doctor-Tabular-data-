import type {
  ClusteringResponse,
  CorrelationResponse,
  OverviewResponse
} from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string") return error;
  }
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

function assertSuccess<T>(payload: T) {
  if (payload && typeof payload === "object" && "error" in payload) {
    throw new Error(getErrorMessage(payload, "The analysis could not be completed."));
  }
  return payload;
}

function upload<T>(
  path: string,
  file: File,
  query: Record<string, string> = {},
  onProgress?: (progress: number) => void
) {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const params = new URLSearchParams(query).toString();
    xhr.open("POST", `${apiUrl(path)}${params ? `?${params}` : ""}`);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error("Dataset Doctor couldn't reach the analysis engine."));
    xhr.ontimeout = () => reject(new Error("The analysis took too long. Please try again."));
    xhr.onload = () => {
      const payload = xhr.response ?? (() => {
        try {
          return JSON.parse(xhr.responseText);
        } catch {
          return null;
        }
      })();
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(getErrorMessage(payload, "The analysis engine returned an error.")));
        return;
      }
      try {
        resolve(assertSuccess(payload) as T);
      } catch (error) {
        reject(error);
      }
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export function analyzeOverview(
  file: File,
  nClusters = 3,
  onProgress?: (progress: number) => void
) {
  return upload<OverviewResponse>(
    "/api/dataset/overview",
    file,
    { n_clusters: String(nClusters) },
    onProgress
  );
}

export function discoverClusters(
  file: File,
  nClusters: number,
  onProgress?: (progress: number) => void
) {
  return upload<ClusteringResponse>(
    "/api/dataset/cluster",
    file,
    { n_clusters: String(nClusters) },
    onProgress
  );
}

export function loadCorrelations(file: File, onProgress?: (progress: number) => void) {
  return upload<CorrelationResponse>("/api/dataset/correlations", file, {}, onProgress);
}