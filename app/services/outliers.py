import pandas as pd


def detect_outliers(df):

    numeric_df = df.select_dtypes(include="number")

    results = {}

    for column in numeric_df.columns:

        series = numeric_df[column].dropna()

        if len(series) == 0:
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outliers = series[
            (series < lower_bound) |
            (series > upper_bound)
        ]

        results[column] = {
            "outlier_count": int(len(outliers)),
            "outlier_percentage": round(
                (len(outliers) / len(series)) * 100,
                2
            ),
            "lower_bound": round(float(lower_bound), 4),
            "upper_bound": round(float(upper_bound), 4)
        }

    return results