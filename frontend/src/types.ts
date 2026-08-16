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
  method?: string;
  features_used?: {
    numeric_columns?: string[];
    ordinal_columns?: string[];
    nominal_columns?: string[];
    removed_id_columns?: string[];
    feature_count_after_encoding?: number;
  };
  cluster_counts?: Record<string, number>;
  dimensionality_reduction?: DimensionalityReduction;
  cluster_profiles?: ClusterProfile[];
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

export interface DimensionalityReduction {
  applied: boolean;
  original_dimensions: number;
  reduced_dimensions: number;
  explained_variance: number;
}

export interface NumericSignal {
  feature: string;
  value: number;
  global_value: number;
  direction: "higher" | "lower" | string;
  difference_score: number;
}

export interface CategoricalSignal {
  feature: string;
  value: string;
  cluster_percentage: number;
  global_percentage: number;
  difference: number;
}

export interface ClusterProfile {
  cluster: number;
  records: number;
  percentage: number;
  numeric_signals: NumericSignal[];
  categorical_signals: CategoricalSignal[];
}

export interface FeatureTypes {
  numeric_count: number;
  ordinal_count: number;
  nominal_count: number;
  numeric_columns: string[];
  ordinal_columns: string[];
  nominal_columns: string[];
}

export interface TreatmentPrescription {
  action: string;
  status: "recommended" | "healthy" | string;
  description: string;
  columns?: string[];
}

export interface TreatmentAction {
  action: string;
  description: string;
  method?: string;
  columns?: string[];
  columns_affected?: number;
  values_affected?: number;
  rows_affected?: number;
}

export interface TreatmentResponse {
  status: string;
  original_rows: number;
  original_columns: number;
  treated_rows: number;
  treated_columns: number;
  duplicates_removed: number;
  numeric_values_imputed: number;
  categorical_values_filled: number;
  ordinal_columns_encoded: string[];
  nominal_columns_encoded: number;
  constant_columns_removed: string[];
  outlier_values_clipped: number;
  remaining_missing_values: number;
  actions: TreatmentAction[];
  output_path: string;
  original_filename: string;
  treated_filename: string;
  download_url: string;
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
  feature_types: FeatureTypes;
  treatment_prescription: TreatmentPrescription[];
  preview: Array<Record<string, unknown>>;
}