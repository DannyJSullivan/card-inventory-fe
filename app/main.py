from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Baseball Card Inventory API",
    description="A FastAPI backend for managing baseball card collections and inventories",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Baseball Card Inventory API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}