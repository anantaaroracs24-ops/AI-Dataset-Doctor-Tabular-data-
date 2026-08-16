import pandas as pd

from app.services.preprocessing import (
    detect_feature_types,
    prepare_features
)


df = pd.read_csv(
    "uploads/application_test.csv"
)

print("\nDATASET")
print("Rows:", len(df))
print("Columns:", len(df.columns))

print("\nFEATURE TYPES")

types = detect_feature_types(df)

print(
    "Numeric:",
    len(types["numeric"])
)

print(
    "Ordinal:",
    types["ordinal"]
)

print(
    "Nominal:",
    len(types["nominal"])
)

print("\nPREPARING FEATURES...")

X, metadata = prepare_features(df)

print("\nRESULT")

print(
    "Original columns:",
    len(df.columns)
)

print(
    "Final ML features:",
    metadata[
        "feature_count_after_encoding"
    ]
)

print(
    "Removed ID columns:",
    metadata[
        "removed_id_columns"
    ]
)

print(
    "Feature matrix shape:",
    X.shape
)