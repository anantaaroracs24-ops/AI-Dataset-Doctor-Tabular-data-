import pandas as pd

from app.services.profiler import (
    get_basic_profile
)

from app.services.quality import (
    analyze_quality,
    calculate_health_score
)

from app.services.statistics import (
    calculate_statistics
)

from app.services.outliers import (
    detect_outliers
)

from app.services.recommendations import (
    generate_recommendations
)

from app.services.correlation import (
    calculate_correlations
)

from app.services.clustering import (
    perform_clustering
)


def generate_overview(df, n_clusters=3):

    # -----------------------------
    # Basic profile
    # -----------------------------

    profile = get_basic_profile(df)

    # -----------------------------
    # Quality
    # -----------------------------

    quality = analyze_quality(df)

    # -----------------------------
    # Statistics
    # -----------------------------

    statistics = calculate_statistics(df)

    # -----------------------------
    # Outliers
    # -----------------------------

    outliers = detect_outliers(df)

    # -----------------------------
    # Recommendations
    # -----------------------------

    recommendations = generate_recommendations(
        df,
        quality,
        outliers
    )

    # -----------------------------
    # Health score
    # -----------------------------

    health_score = calculate_health_score(
        quality,
        outliers
    )

    # -----------------------------
    # Correlations
    # -----------------------------

    correlations = calculate_correlations(df)

    # -----------------------------
    # Clustering
    # -----------------------------

    try:

        clustering = perform_clustering(
            df,
            n_clusters
        )

    except ValueError as e:

        clustering = {
            "available": False,
            "message": str(e)
        }

    # -----------------------------
    # Dataset preview
    # -----------------------------

    preview = df.head(10).copy()

    preview = preview.where(
        pd.notnull(preview),
        None
    )

    preview = preview.to_dict(
        orient="records"
    )

    # -----------------------------
    # Final response
    # -----------------------------

    return {

        "dataset": profile,

        "health_score": health_score,

        "quality": quality,

        "statistics": statistics,

        "outliers": outliers,

        "correlations": correlations,

        "recommendations": recommendations,

        "clustering": clustering,

        "preview": preview
    }