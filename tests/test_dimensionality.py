import pandas as pd

from app.services.preprocessing import prepare_features
from app.services.dimensionality import reduce_dimensions


df = pd.read_csv(
    "uploads/application_test.csv"
)

print("Preparing features...")

X, metadata = prepare_features(df)

print(
    "Original ML feature matrix:",
    X.shape
)

print("\nApplying dimensionality reduction...")

X_reduced, reduction_info = reduce_dimensions(X)

print("\nDIMENSIONALITY REDUCTION")

print(
    "Applied:",
    reduction_info["applied"]
)

print(
    "Original dimensions:",
    reduction_info["original_dimensions"]
)

print(
    "Reduced dimensions:",
    reduction_info["reduced_dimensions"]
)

print(
    "Explained variance:",
    reduction_info["explained_variance"],
    "%"
)

print(
    "Reduced matrix shape:",
    X_reduced.shape
)