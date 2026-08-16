import pandas as pd

from app.services.clustering import perform_clustering


print("Loading dataset...")

df = pd.read_csv(
    "uploads/application_test.csv"
)

print(
    "Dataset shape:",
    df.shape
)

print("\nRunning mixed-type clustering...")

result = perform_clustering(
    df,
    n_clusters=3
)

print("\n========== CLUSTERING ==========")

print(
    "Method:",
    result["method"]
)

print(
    "Clusters:",
    result["n_clusters"]
)

print(
    "Original ML features:",
    result[
        "dimensionality_reduction"
    ]["original_dimensions"]
)

print(
    "Reduced dimensions:",
    result[
        "dimensionality_reduction"
    ]["reduced_dimensions"]
)

print(
    "Variance retained:",
    result[
        "dimensionality_reduction"
    ]["explained_variance"],
    "%"
)

print(
    "\nCluster counts:"
)

for cluster, count in (
    result["cluster_counts"].items()
):

    print(
        f"  Cluster {cluster}: {count:,}"
    )

print(
    "\nCluster profiles:"
)

for profile in result[
    "cluster_profiles"
]:

    print(
        f"\nCluster {profile['cluster']}"
    )

    print(
        f"Records: {profile['records']:,}"
    )

    print(
        f"Percentage: {profile['percentage']}%"
    )

    print(
        "Numerical signals:"
    )

    for signal in profile[
        "numeric_signals"
    ]:

        print(
            f"  {signal['feature']}: "
            f"{signal['direction']} "
            f"(score={signal['difference_score']})"
        )

    print(
        "Categorical signals:"
    )

    for signal in profile[
        "categorical_signals"
    ]:

        print(
            f"  {signal['feature']} = "
            f"{signal['value']} "
            f"(+{signal['difference']} percentage points)"
        )

print(
    "\nPCA visualization points:",
    len(
        result["pca"]["points"]
    )
)