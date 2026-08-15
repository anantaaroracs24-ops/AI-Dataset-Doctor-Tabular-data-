from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.dataset import router as dataset_router


app = FastAPI(
    title="AI Dataset Doctor",
    description="AI-powered tabular dataset analysis API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    dataset_router,
    prefix="/api/dataset",
    tags=["Dataset"]
)


@app.get("/")
def root():

    return {
        "message": "AI Dataset Doctor API is running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }