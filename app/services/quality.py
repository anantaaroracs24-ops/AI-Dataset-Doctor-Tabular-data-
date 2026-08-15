import pandas as pd


def analyze_quality(df):

    missing = df.isnull().sum()

    missing_data = []

    for column in df.columns:
        count = int(missing[column])

        missing_data.append({
            "column": column,
            "missing_count": count,
            "missing_percentage": round(
                (count / len(df)) * 100, 2
            )
        })

    duplicate_count = int(df.duplicated().sum())

    data_types = []

    for column in df.columns:
        data_types.append({
            "column": column,
            "dtype": str(df[column].dtype),
            "unique_values": int(df[column].nunique())
        })

    constant_columns = [
        column
        for column in df.columns
        if df[column].nunique() <= 1
    ]

    return {
        "missing_values": missing_data,
        "duplicate_rows": duplicate_count,
        "duplicate_percentage": round(
            (duplicate_count / len(df)) * 100, 2
        ),
        "data_types": data_types,
        "constant_columns": constant_columns
    }

def calculate_health_score(quality, outliers):

    score = 100

    missing_percentage = 0

    for item in quality["missing_values"]:
        missing_percentage += item["missing_percentage"]

    if missing_percentage > 0:
        score -= min(missing_percentage * 0.5, 20)

    if quality["duplicate_percentage"] > 0:
        score -= min(
            quality["duplicate_percentage"] * 0.5,
            15
        )

    if len(quality["constant_columns"]) > 0:
        score -= min(
            len(quality["constant_columns"]) * 5,
            15
        )

    for result in outliers.values():

        if result["outlier_percentage"] > 5:
            score -= 5

    return max(0, round(score))