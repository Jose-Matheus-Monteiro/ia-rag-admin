import httpx
import trafilatura


class ScraperService:
    async def fetch(self, url: str) -> dict:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()
            html = response.text

        text = trafilatura.extract(html, include_links=False, include_images=False) or ""
        return {"url": url, "text": text.strip(), "html": html[:5000]}
