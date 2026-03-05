from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import work_api, health_api
from app.core.database import Database
from app.core.cache import InMemoryCache
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await Database().check_health()
    await InMemoryCache().check_health()
    yield

app = FastAPI(
    title="TeamLeadKit API",
    description="Lightweight work & team management toolkit for team leads",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_api.router, prefix="/api", tags=["Health"])
app.include_router(work_api.router, prefix="/api/work", tags=["Work"])
