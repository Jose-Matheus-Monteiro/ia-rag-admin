from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.dependencies import require_auth
from services.scraper_service import ScraperService

router = APIRouter(prefix="/scrape", tags=["scraper"], dependencies=[Depends(require_auth)])


class ScrapeRequest(BaseModel):
    url: str


@router.post("")
async def scrape(body: ScrapeRequest):
    try:
        return await ScraperService().fetch(body.url)
    except Exception as e:
        raise HTTPException(400, f"Erro ao extrair URL: {e}")
