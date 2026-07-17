import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas.response import ErrorResponse
from app.api.auth import router as auth_router
from app.api.shops import router as shops_router
from app.api.categories import router as categories_router
from app.api.products import router as products_router
from app.api.customers import router as customers_router
from app.api.transactions import router as transactions_router
from app.api.dashboard import router as dashboard_router
from app.api.credit_risk import router_generic as credit_risk_generic_router
from app.api.credit_risk import router_customer as credit_risk_customer_router
from app.api.demand_forecast import router_generic as demand_generic_router
from app.api.demand_forecast import router_shop as demand_shop_router
from app.api.voice import router as voice_router
from app.core.ml_manager import load_credit_risk_model, load_demand_model

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Models are loaded exactly once on startup and kept in process memory
    for the lifetime of the application — no per-request disk I/O.
    """
    logger.info("=== Spark DeepStack API starting up ===")
    logger.info("Loading ML models...")

    try:
        credit_model = load_credit_risk_model()
        if credit_model is not None:
            logger.info("✓ Credit risk model ready: %r", credit_model)
        else:
            logger.warning("✗ Credit risk model could NOT be loaded (model file missing)")
    except Exception as exc:
        logger.error("Error loading credit risk model: %s", exc, exc_info=True)

    try:
        demand_model = load_demand_model()
        if demand_model is not None:
            logger.info("✓ Demand forecasting model ready: %s", type(demand_model).__name__)
        else:
            logger.warning("✗ Demand forecasting model could NOT be loaded (model file missing)")
    except Exception as exc:
        logger.error("Error loading demand model: %s", exc, exc_info=True)

    logger.info("=== Application ready to serve requests ===")
    yield
    logger.info("=== Spark DeepStack API shutting down ===")


app = FastAPI(
    title="Spark DeepStack API",
    description=(
        "Backend API for the Spark Hackathon retail management platform. "
        "Includes credit risk scoring and demand forecasting powered by ML models."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Confirmation-Text", "X-Processed-Count"],
)


# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            message=exc.detail if isinstance(exc.detail, str) else "An error occurred",
            detail=str(exc.detail),
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            message="Internal server error",
            detail=str(exc),
        ).model_dump(),
    )


from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    details = []
    for err in errors:
        loc = " -> ".join(str(x) for x in err.get("loc", []))
        msg = err.get("msg", "Validation error")
        details.append(f"{loc}: {msg}")
    detail_str = "; ".join(details)
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            message="Validation error",
            detail=detail_str,
        ).model_dump(),
    )


# Register routers
API_V1 = "/api/v1"

# Existing routers
app.include_router(auth_router, prefix=API_V1)
app.include_router(shops_router, prefix=API_V1)
app.include_router(categories_router, prefix=API_V1)
app.include_router(products_router, prefix=API_V1)
app.include_router(customers_router, prefix=API_V1)
app.include_router(transactions_router, prefix=API_V1)
app.include_router(dashboard_router, prefix=API_V1)

# ML routers
app.include_router(credit_risk_generic_router, prefix=API_V1)
app.include_router(credit_risk_customer_router, prefix=API_V1)
app.include_router(demand_generic_router, prefix=API_V1)
app.include_router(demand_shop_router, prefix=API_V1)
app.include_router(voice_router, prefix=API_V1)


@app.get("/")
def root():
    return {"message": "Spark DeepStack API is running"}


@app.get("/health")
def health():
    from app.core.ml_manager import get_credit_risk_predictor, get_demand_forecaster
    return {
        "status": "healthy",
        "ml_models": {
            "credit_risk": "loaded" if get_credit_risk_predictor() is not None else "not_loaded",
            "demand_forecasting": "loaded" if get_demand_forecaster() is not None else "not_loaded",
        },
    }
