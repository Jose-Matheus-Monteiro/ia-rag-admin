import re

import httpx
import trafilatura


def _extract_confluence(html: str) -> str:
    pos = html.find('class="wiki-content">')
    if pos == -1:
        return ""

    chunk = html[pos + len('class="wiki-content">'):]

    chunk = re.sub(r'<script[\s\S]*?</script>', ' ', chunk)
    chunk = re.sub(r'<style[\s\S]*?</style>', ' ', chunk)
    chunk = re.sub(r'&nbsp;', ' ', chunk)
    chunk = re.sub(r'&[a-z]+;', '', chunk)
    chunk = re.sub(r'<[^>]+>', ' ', chunk)
    chunk = re.sub(r'[ \t]+', ' ', chunk)

    lines = []
    for line in chunk.split('\n'):
        line = line.strip()
        if not line:
            continue
        if any(stop in line for stop in ('Criado por', 'Modificado por', 'serverDuration', 'Atlassian')):
            break
        lines.append(line)

    return '\n'.join(lines).strip()


class ScraperService:
    async def fetch(self, url: str) -> dict:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()
            html = response.text

        text = ""

        if 'class="wiki-content">' in html:
            text = _extract_confluence(html)

        if not text:
            text = trafilatura.extract(html, include_links=False, include_images=False) or ""

        return {"url": url, "text": text.strip(), "html": html[:5000]}
