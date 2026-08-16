import pandas as pd

from app.services.treatment import treat_dataset


INPUT_FILE = "uploads/application_test.csv"
OUTPUT_FILE = "uploads/application_test_treated.csv"


print("Loading dataset...")

df = pd.read_csv(INPUT_FILE)

print(
    "Original shape:",
    df.shape
)

print(
    "Original missing values:",
    int(df.isna().sum().sum())
)

print("\nApplying treatment...")

treated_df, report = treat_dataset(
    df,
    OUTPUT_FILE,
    remove_duplicates=True,
    remove_constant_columns=True,
    clip_outliers=False,
)

print("\n========== TREATMENT REPORT ==========")

print(
    "Original shape:",
    (
        report["original_rows"],
        report["original_columns"]
    )
)

print(
    "Treated shape:",
    (
        report["treated_rows"],
        report["treated_columns"]
    )
)

print(
    "Duplicates removed:",
    report["duplicates_removed"]
)

print(
    "Numeric values imputed:",
    report["numeric_values_imputed"]
)

print(
    "Categorical values filled:",
    report["categorical_values_filled"]
)

print(
    "Ordinal columns encoded:",
    report["ordinal_columns_encoded"]
)

print(
    "Nominal columns encoded:",
    report["nominal_columns_encoded"]
)

print(
    "Constant columns removed:",
    len(
        report["constant_columns_removed"]
    )
)

print(
    "Remaining missing values:",
    report["remaining_missing_values"]
)

print("\nActions:")

for action in report["actions"]:
    print(
        "-",
        action["action"],
        ":",
        action["description"]
    )

print(
    "\nSaved treated dataset to:",
    report["output_path"]
)