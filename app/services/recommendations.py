def generate_recommendations(
    df,
    quality,
    outliers
):

    recommendations = []

    # Missing values
    for item in quality["missing_values"]:

        percentage = item["missing_percentage"]
        column = item["column"]

        if percentage == 0:
            continue

        if percentage >= 50:
            recommendations.append({
                "severity": "high",
                "column": column,
                "problem": "High missing values",
                "recommendation":
                    "Consider dropping this column or using advanced imputation."
            })

        elif percentage >= 10:
            recommendations.append({
                "severity": "medium",
                "column": column,
                "problem": "Significant missing values",
                "recommendation":
                    "Consider median/mode imputation or investigating why values are missing."
            })

        else:
            recommendations.append({
                "severity": "low",
                "column": column,
                "problem": "Missing values detected",
                "recommendation":
                    "Consider imputing the missing values."
            })

    # Duplicates
    if quality["duplicate_rows"] > 0:

        recommendations.append({
            "severity": "medium",
            "column": None,
            "problem": "Duplicate rows detected",
            "recommendation":
                "Review duplicate records and remove them if they represent repeated observations."
        })

    # Constant columns
    for column in quality["constant_columns"]:

        recommendations.append({
            "severity": "medium",
            "column": column,
            "problem": "Constant column",
            "recommendation":
                "Consider removing this column because it provides little predictive information."
        })

    # Outliers
    for column, result in outliers.items():

        if result["outlier_percentage"] >= 5:

            recommendations.append({
                "severity": "medium",
                "column": column,
                "problem": "High number of outliers",
                "recommendation":
                    "Investigate extreme values before training a machine learning model."
            })

    return recommendations