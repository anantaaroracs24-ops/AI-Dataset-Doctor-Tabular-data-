export type PageKey =
  | "dashboard"
  | "dataset"
  | "diagnosis"
  | "patterns"
  | "prescription";

export type Severity = "high" | "medium" | "low" | string;

export interface DatasetProfile {
  rows: number;
  columns: number;
  column_names: string[];
  memory_usage_mb: number;
  filename?: string;
}

export interface MissingValue {
  column: string;
  missing_count: number;
  missing_percentage: number;
}

export interface DataTypeInfo {
  column: string;
  dtype: string;
  unique_values: number;
}

export interface Quality {
  missing_values: MissingValue[];
  duplicate_rows: number;
  duplicate_percentage: number;
  data_types: DataTypeInfo[];
  constant_columns: string[];
}

export interface OutlierResult {
  outlier_count: number;
  outlier_percentage: number;
  lower_bound: number;
  upper_bound: number;
}

export interface Recommendation {
  severity: Severity;
  column: string | null;
  problem: string;
  recommendation: string;
}

export interface Correlation {
  feature_1: string;
  feature_2: string;
  correlation: number;
  strength: string;
}

export interface CorrelationResponse {
  features?: string[];
  correlations?: Correlation[];
  message?: string;
}

export interface ClusterPoint {
  x: number;
  y: number;
  cluster: number;
}

export interface ClusteringResponse {
  n_clusters?: number;
  features_used?: string[];
  cluster_counts?: Record<string, number>;
  cluster_centers?: Array<{
    cluster: number;
    center: Record<string, number>;
  }>;
  pca?: {
    explained_variance: {
      pc1: number;
      pc2: number;
    };
    points: ClusterPoint[];
  };
  data?: Array<Record<string, unknown>>;
  available?: boolean;
  message?: string;
}

export interface OverviewResponse {
  dataset: DatasetProfile;
  health_score: number;
  quality: Quality;
  statistics: Record<string, Record<string, number>>;
  outliers: Record<string, OutlierResult>;
  recommendations: Recommendation[];
  correlations?: CorrelationResponse;
  clustering?: ClusteringResponse;
  preview: Array<Record<string, unknown>>;
}