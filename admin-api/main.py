from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.database import Base, engine
from api.routes import auth, nodes, scraper

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IA RAG Admin", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(nodes.router)
app.include_router(scraper.router)


@app.get("/health")
def health():
    return {"status": "ok"}
