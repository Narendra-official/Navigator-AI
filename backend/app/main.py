from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.api.agent_routes import router as agent_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "OpenSource Navigator AI Backend API - Empowering beginner developers and students "
        "to discover real GitHub issues and navigate their first open-source contributions "
        "using local open-weight AI models."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for all allowed frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(agent_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to OpenSource Navigator AI API",
        "documentation": "/docs",
        "health_check": f"{settings.API_V1_PREFIX}/health",
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
