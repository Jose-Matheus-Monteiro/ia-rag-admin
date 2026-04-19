import re

import httpx
import trafilatura

_NOISE_LINES = {
    'Import HTML Content',
    'Conteúdo das Ferramentas',
    'Tarefas',
    'Visão Geral',
    'Sem rótulos',
}

_STOP_WORDS = ('Criado por', 'Modificado por', 'serverDuration', 'Atlassian', 'Reportar um problema')


def _html_to_text(chunk: str) -> str:
    chunk = re.sub(r'<script[\s\S]*?</script>', '', chunk)
    chunk = re.sub(r'<style[\s\S]*?</style>', '', chunk)

    # imagens → texto do alt
    chunk = re.sub(r'<img[^>]+alt=["\']([^"\']+)["\'][^>]*/?>',
                   lambda m: m.group(1), chunk)
    chunk = re.sub(r'<img[^>]*/?>', '', chunk)

    # links → só o texto
    chunk = re.sub(r'<a[^>]*>([\s\S]*?)</a>', r'\1', chunk)

    # células de tabela → separador de coluna
    chunk = re.sub(r'</t[dh]>', ' | ', chunk)
    # fim de linha de tabela
    chunk = re.sub(r'</tr>', '\n', chunk)

    # cabeçalhos → nova linha
    chunk = re.sub(r'<h[1-6][^>]*>', '\n', chunk)
    chunk = re.sub(r'</h[1-6]>', '\n', chunk)

    # parágrafos e quebras → nova linha
    chunk = re.sub(r'<br\s*/?>', '\n', chunk)
    chunk = re.sub(r'</p>', '\n', chunk)
    chunk = re.sub(r'</li>', '\n', chunk)

    # entidades HTML comuns
    chunk = re.sub(r'&nbsp;', ' ', chunk)
    chunk = re.sub(r'&amp;', '&', chunk)
    chunk = re.sub(r'&lt;', '<', chunk)
    chunk = re.sub(r'&gt;', '>', chunk)
    chunk = re.sub(r'&#[0-9]+;', '', chunk)
    chunk = re.sub(r'&[a-z]+;', '', chunk)

    # remover tags restantes
    chunk = re.sub(r'<[^>]+>', '', chunk)

    return chunk


def _clean(text: str) -> str:
    lines = []
    for line in text.splitlines():
        line = ' '.join(line.split())
        # remover separador de coluna sobrando no início/fim da linha
        line = line.strip(' |').strip()
        if not line:
            continue
        if any(stop in line for stop in _STOP_WORDS):
            break
        if line in _NOISE_LINES:
            continue
        lines.append(line)
    return '\n'.join(lines).strip()


def _extract_confluence(html: str) -> str:
    pos = html.find('class="wiki-content">')
    if pos == -1:
        return ""
    chunk = html[pos + len('class="wiki-content">'):]
    return _html_to_text(chunk)


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

        return {"url": url, "text": _clean(text), "html": html[:5000]}
