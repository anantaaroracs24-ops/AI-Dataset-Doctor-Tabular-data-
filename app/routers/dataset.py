import os
import uuid
import math

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Query
)

from app.services.clustering import perform_clustering
from app.services.correlation import calculate_correlations
from app.services.overview import generate_overview
from app.services.profiler import load_dataset, get_basic_profile
from app.services.quality import analyze_quality, calculate_health_score
from app.services.statistics import calculate_statistics
from app.services.outliers import detect_outliers
from app.services.recommendations import generate_recommendations

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
