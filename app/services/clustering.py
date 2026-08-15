import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA


def perform_clustering(df, n_clusters=3):

    # --------------------------------
    # 1. Select numerical columns
    # --------------------------------

    numeric_df = df.select_dtypes(
        include="number"
    ).copy()

    if numeric_df.shape[1] < 2:
        raise ValueError(
            "At least two numerical columns are required for clustering."
        )

    # Remove completely empty columns
    numeric_df = numeric_df.dropna(
        axis=1,
        how="all"
    )

    if numeric_df.shape[1] < 2:
        raise ValueError(
            "Not enough usable numerical columns after removing empty columns."
        )

    # --------------------------------
    # 2. Fill missing values
    # --------------------------------

    numeric_df = numeric_df.fillna(
        numeric_df.median()
    )

    # Remove columns that still contain NaN
    numeric_df = numeric_df.dropna(
        axis=1
    )

    if numeric_df.shape[1] < 2:
        raise ValueError(
            "Not enough usable numerical columns for clustering."
        )

    # --------------------------------
    # 3. Standardize
    # --------------------------------

    scaler = StandardScaler()

    scaled_data = scaler.fit_transform(
        numeric_df
    )

    # --------------------------------
    # 4. K-Means
    # --------------------------------

    model = KMeans(
        n_clusters=n_clusters,
        random_state=42,
        n_init=10
    )

    clusters = model.fit_predict(
        scaled_data
    )

    # --------------------------------
    # 5. Add cluster labels
    # --------------------------------

    result = df.copy()

    result["cluster"] = clusters

    # --------------------------------
    # 6. Cluster counts
    # --------------------------------

    cluster_counts = (
        result["cluster"]
        .value_counts()
        .sort_index()
        .to_dict()
    )

    cluster_counts = {
        str(key): int(value)
        for key, value in cluster_counts.items()
    }

    # --------------------------------
    # 7. Cluster centers
    # --------------------------------

    centers = model.cluster_centers_

    cluster_centers = []

    for index, center in enumerate(centers):

        cluster_centers.append({
            "cluster": index,
            "center": {
                column: round(
                    float(value),
                    4
                )
                for column, value
                in zip(
                    numeric_df.columns,
                    center
                )
            }
        })

    # --------------------------------
    # 8. PCA
    # --------------------------------

    pca = PCA(
        n_components=2
    )

    pca_data = pca.fit_transform(
        scaled_data
    )

    # --------------------------------
    # 9. Create visualization data
    # --------------------------------

    visualization_data = []

    for index in range(len(pca_data)):

        visualization_data.append({
            "x": round(
                float(pca_data[index][0]),
                4
            ),
            "y": round(
                float(pca_data[index][1]),
                4
            ),
            "cluster": int(clusters[index])
        })

    # Limit points sent to frontend
    visualization_data = visualization_data[:1000]

    # --------------------------------
    # 10. Explained variance
    # --------------------------------

    explained_variance = {
        "pc1": round(
            float(pca.explained_variance_ratio_[0]) * 100,
            2
        ),
        "pc2": round(
            float(pca.explained_variance_ratio_[1]) * 100,
            2
        )
    }

    # --------------------------------
    # 11. Sample data
    # --------------------------------

    sample_data = result.head(100).copy()

    sample_data = sample_data.where(
        pd.notnull(sample_data),
        None
    )

    sample_data = sample_data.to_dict(
        orient="records"
    )

    # --------------------------------
    # 12. Final response
    # --------------------------------

    return {

        "n_clusters":
            n_clusters,

        "features_used":
            numeric_df.columns.tolist(),

        "cluster_counts":
            cluster_counts,

        "cluster_centers":
            cluster_centers,

        "pca": {

            "explained_variance":
                explained_variance,

            "points":
                visualization_data
        },

        "data":
            sample_data
    }