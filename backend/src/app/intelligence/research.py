"""Web research agent: search, fetch, and extract real content about companies."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

import httpx
import trafilatura
from ddgs import DDGS

logger = logging.getLogger(__name__)

MAX_SOURCES = 15
MAX_CONTENT_PER_SOURCE = 5000  # chars per source document
MAX_COMBINED_TEXT = 50000  # chars total for LLM context
FETCH_TIMEOUT = 15  # seconds per URL


@dataclass
class SearchResult:
    url: str
    title: str
    snippet: str


@dataclass
class SourceDocument:
    url: str
    title: str
    content: str
    fetch_date: datetime


@dataclass
class ResearchContext:
    sources: list[SourceDocument] = field(default_factory=list)

    @property
    def combined_text(self) -> str:
        """All source content concatenated, truncated to fit LLM context."""
        parts = []
        total = 0
        for i, src in enumerate(self.sources):
            header = f"\n\n--- SOURCE [{i + 1}]: {src.title} ({src.url}) ---\n\n"
            content = src.content[:MAX_CONTENT_PER_SOURCE]
            chunk = header + content
            if total + len(chunk) > MAX_COMBINED_TEXT:
                remaining = MAX_COMBINED_TEXT - total
                if remaining > 200:
                    parts.append(chunk[:remaining])
                break
            parts.append(chunk)
            total += len(chunk)
        return "".join(parts)

    @property
    def source_summary(self) -> str:
        """Index of all sources for the LLM to reference in citations."""
        lines = []
        for i, src in enumerate(self.sources):
            lines.append(f"[{i + 1}] {src.title} — {src.url}")
        return "\n".join(lines)


def search_company(company_name: str) -> list[SearchResult]:
    """Search the web for information about a company using DuckDuckGo."""
    queries = [
        f'"{company_name}" company',
        f'"{company_name}" founders CEO funding startup',
        f'"{company_name}" product launch news 2024 2025',
        f'"{company_name}" competitors market analysis',
    ]

    seen_urls: set[str] = set()
    results: list[SearchResult] = []

    ddgs = DDGS()
    for query in queries:
        try:
            hits = ddgs.text(query, max_results=5)
            for hit in hits:
                url = hit.get("href", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    results.append(
                        SearchResult(
                            url=url,
                            title=hit.get("title", ""),
                            snippet=hit.get("body", ""),
                        )
                    )
        except Exception as e:
            logger.warning(f"Search failed for query '{query}': {e}")
            continue

    logger.info(
        f"Found {len(results)} unique URLs for '{company_name}'"
    )
    return results[:MAX_SOURCES]


async def _fetch_one(
    client: httpx.AsyncClient, url: str
) -> tuple[str, str | None]:
    """Fetch a single URL and return (url, html_or_none)."""
    try:
        response = await client.get(
            url,
            follow_redirects=True,
            timeout=FETCH_TIMEOUT,
        )
        if response.status_code == 200 and "text/html" in response.headers.get(
            "content-type", ""
        ):
            return url, response.text
    except Exception as e:
        logger.debug(f"Failed to fetch {url}: {e}")
    return url, None


async def fetch_and_extract(
    search_results: list[SearchResult],
) -> list[SourceDocument]:
    """Fetch URLs concurrently and extract clean text with trafilatura."""
    documents: list[SourceDocument] = []
    now = datetime.now(timezone.utc)

    async with httpx.AsyncClient(
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        },
    ) as client:
        tasks = [_fetch_one(client, sr.url) for sr in search_results]
        results = await asyncio.gather(*tasks)

    # Build a title lookup from search results
    title_map = {sr.url: sr.title for sr in search_results}

    for url, html in results:
        if html is None:
            continue
        try:
            text = trafilatura.extract(
                html,
                include_comments=False,
                include_tables=True,
                favor_recall=True,
            )
            if text and len(text.strip()) > 100:
                documents.append(
                    SourceDocument(
                        url=url,
                        title=title_map.get(url, ""),
                        content=text.strip(),
                        fetch_date=now,
                    )
                )
        except Exception as e:
            logger.debug(f"Extraction failed for {url}: {e}")

    logger.info(
        f"Extracted content from {len(documents)}/{len(search_results)} URLs"
    )
    return documents


async def research_company(company_name: str) -> ResearchContext:
    """Full research pipeline: search → fetch → extract → bundle."""
    # Search is synchronous (duckduckgo-search uses requests internally)
    search_results = await asyncio.to_thread(search_company, company_name)

    if not search_results:
        logger.warning(f"No search results found for '{company_name}'")
        return ResearchContext()

    # Fetch and extract content from all URLs concurrently
    documents = await fetch_and_extract(search_results)

    context = ResearchContext(sources=documents)
    logger.info(
        f"Research complete for '{company_name}': "
        f"{len(documents)} sources, "
        f"{len(context.combined_text)} chars of content"
    )
    return context
