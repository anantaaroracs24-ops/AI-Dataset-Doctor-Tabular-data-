import os
import uuid
import math

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Query,
    HTTPException
)

from fastapi.responses import FileResponse

from app.services.clustering import perform_clustering
from app.services.correlation import calculate_correlations
from app.services.overview import generate_overview
from app.services.profiler import load_dataset, get_basic_profile
from app.services.quality import analyze_quality, calculate_health_score
from app.services.statistics import calculate_statistics
from app.services.outliers import detect_outliers
from app.services.recommendations import generate_recommendations
from app.services.treatment import treat_dataset

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def make_json_safe(obj):
    if isinstance(obj, dict):
        return {key: make_json_safe(value) for key, value in obj.items()}
    if isinstance(obj, list):
        return [make_json_safe(value) for value in obj]
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    return obj


@router.post("/analyze")
async def analyze_dataset(file: UploadFile = File(...)):
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in [".csv", ".xlsx", ".xls"]:
        return {"error": "Only CSV and Excel files are supported."}

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, file_id + file_extension)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    df = load_dataset(file_path)

    profile = get_basic_profile(df)
    quality = analyze_quality(df)
    statistics = calculate_statistics(df)
    outliers = detect_outliers(df)
    recommendations = generate_recommendations(df, quality, outliers)
    health_score = calculate_health_score(quality, outliers)

    result = {
        "dataset": profile,
        "quality": quality,
        "statistics": statistics,
        "outliers": outliers,
        "health_score": health_score,
        "recommendations": recommendations
    }

    return make_json_safe(result)


@router.post("/cluster")
async def cluster_dataset(
    file: UploadFile = File(...),
    n_clusters: int = Query(default=3, ge=2, le=10)
):
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in [".csv", ".xlsx", ".xls"]:
        return {"error": "Only CSV and Excel files are supported."}

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, file_id + file_extension)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    df = load_dataset(file_path)

    if len(df) < n_clusters:
        return {"error": f"Dataset must contain at least {n_clusters} rows."}

    try:
        result = perform_clustering(df, n_clusters)
        return make_json_safe(result)
    except ValueError as e:
        return {"error": str(e)}


@router.post("/correlations")
async def dataset_correlations(file: UploadFile = File(...)):
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in [".csv", ".xlsx", ".xls"]:
        return {"error": "Only CSV and Excel files are supported."}

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, file_id + file_extension)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    df = load_dataset(file_path)
    result = calculate_correlations(df)

    return make_json_safe(result)


@router.post("/overview")
async def dataset_overview(
    file: UploadFile = File(...),
    n_clusters: int = Query(default=3, ge=2, le=10)
):
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in [".csv", ".xlsx", ".xls"]:
        return {"error": "Only CSV and Excel files are supported."}

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, file_id + file_extension)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    df = load_dataset(file_path)

    result = generate_overview(df, n_clusters)
    result["dataset"]["filename"] = file.filename

    return make_json_safe(result)
    

@router.post("/treat")
async def treat_dataset_endpoint(
    file: UploadFile = File(...),
    remove_duplicates: bool = Query(default=True),
    remove_constant_columns: bool = Query(default=True),
    clip_outliers: bool = Query(default=False)
):
    """
    Diagnose-driven treatment of an uploaded dataset.

    The endpoint:
    - removes duplicate rows
    - imputes missing numerical values
    - fills missing categorical values
    - encodes ordinal features
    - one-hot encodes nominal features
    - removes constant columns
    - optionally clips extreme numerical values
    - saves a treated CSV
    """

    file_extension = os.path.splitext(
        file.filename
    )[1].lower()

    if file_extension not in [
        ".csv",
        ".xlsx",
        ".xls"
    ]:
        return {
            "error": "Only CSV and Excel files are supported."
        }

    # -----------------------------------------------------
    # Save uploaded dataset
    # -----------------------------------------------------

    file_id = str(uuid.uuid4())

    original_path = os.path.join(
        UPLOAD_DIR,
        f"{file_id}_original{file_extension}"
    )

    contents = await file.read()

    with open(original_path, "wb") as f:
        f.write(contents)

    # -----------------------------------------------------
    # Load dataset
    # -----------------------------------------------------

    try:
        df = load_dataset(original_path)
    except Exception as e:
        return {
            "error": f"Could not load dataset: {str(e)}"
        }

    # -----------------------------------------------------
    # Create output path
    # -----------------------------------------------------

    treated_file_id = str(uuid.uuid4())

    treated_filename = (
        f"{os.path.splitext(file.filename)[0]}"
        f"_treated.csv"
    )

    treated_path = os.path.join(
        UPLOAD_DIR,
        f"{treated_file_id}.csv"
    )

    # -----------------------------------------------------
    # Apply treatment
    # -----------------------------------------------------

    try:

        treated_df, report = treat_dataset(
            df,
            treated_path,
            remove_duplicates=remove_duplicates,
            remove_constant_columns=remove_constant_columns,
            clip_outliers=clip_outliers,
        )

    except Exception as e:

        return {
            "error": f"Treatment failed: {str(e)}"
        }

    # -----------------------------------------------------
    # Add download information
    # -----------------------------------------------------

    report["original_filename"] = file.filename
    report["treated_filename"] = treated_filename

    report["download_url"] = (
        f"/api/dataset/download/{treated_file_id}"
    )

    return make_json_safe(report)

@router.get("/download/{file_id}")
async def download_treated_dataset(
    file_id: str
):
    """
    Download a previously treated dataset.
    """

    file_path = os.path.join(
        UPLOAD_DIR,
        f"{file_id}.csv"
    )

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Treated dataset not found."
        )

    return FileResponse(
        path=file_path,
        media_type="text/csv",
        filename="dataset_doctor_treated.csv"
    )
