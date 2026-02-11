"""Web research agent: search, fetch, and extract real content about companies."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

import httpx
import trafilatura
from ddgs import DDGS
from markdownify import markdownify as md

logger = logging.getLogger(__name__)

MAX_SOURCES = 15
MAX_CONTENT_PER_SOURCE = 5000  # chars per source document
MAX_COMBINED_TEXT = 50000  # chars total for LLM context
FETCH_TIMEOUT = 15  # seconds per URL


def html_to_markdown(html: str) -> str:
    """Convert HTML to clean Markdown."""
    try:
        return md(html, heading_style="ATX", strip=["img", "script", "style"])
    except Exception:
        return ""


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
    content_md: str = ""  # markdown version of content


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
        f'"{company_name}" documentation API developer docs',
        f'"{company_name}" technical blog engineering changelog',
        f'"{company_name}" customers clients case studies testimonials',
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


def _search_docs(company_name: str) -> list[SearchResult]:
    """Search for developer documentation, API references, and technical resources."""
    queries = [
        f'"{company_name}" API reference documentation developer guide',
        f'"{company_name}" SDK changelog release notes',
        f'site:github.com "{company_name}"',
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
            logger.warning(f"Docs search failed for query '{query}': {e}")
            continue

    logger.info(f"Found {len(results)} doc URLs for '{company_name}'")
    return results[:5]


def search_social_linkedin(
    company_name: str, founder_names: list[str] | None = None
) -> list[SearchResult]:
    """Search LinkedIn via DuckDuckGo site:linkedin.com."""
    queries = [f'site:linkedin.com "{company_name}"']
    for name in (founder_names or [])[:3]:
        queries.append(f'site:linkedin.com "{name}"')

    seen_urls: set[str] = set()
    results: list[SearchResult] = []
    with DDGS() as ddgs:
        for query in queries:
            try:
                for r in ddgs.text(query, max_results=5):
                    url = r.get("href", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        results.append(
                            SearchResult(
                                url=url,
                                title=r.get("title", ""),
                                snippet=r.get("body", ""),
                            )
                        )
            except Exception as exc:
                logger.warning("LinkedIn search failed for %r: %s", query, exc)
    return results


def search_social_twitter(
    company_name: str,
    founder_names: list[str] | None = None,
    handles: list[str] | None = None,
) -> list[SearchResult]:
    """Search X/Twitter via DuckDuckGo site:x.com."""
    queries = [f'site:x.com "{company_name}"']
    for handle in (handles or [])[:3]:
        clean = handle.lstrip("@")
        queries.append(f"site:x.com from:{clean}")
    for name in (founder_names or [])[:3]:
        queries.append(f'site:x.com "{name}"')

    seen_urls: set[str] = set()
    results: list[SearchResult] = []
    with DDGS() as ddgs:
        for query in queries:
            try:
                for r in ddgs.text(query, max_results=5):
                    url = r.get("href", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        results.append(
                            SearchResult(
                                url=url,
                                title=r.get("title", ""),
                                snippet=r.get("body", ""),
                            )
                        )
            except Exception as exc:
                logger.warning("Twitter search failed for %r: %s", query, exc)
    return results


async def search_hackernews(company_name: str) -> list[SearchResult]:
    """Search Hacker News via Algolia API (free, no auth)."""
    results: list[SearchResult] = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://hn.algolia.com/api/v1/search",
                params={
                    "query": company_name,
                    "tags": "story",
                    "hitsPerPage": 10,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            for hit in data.get("hits", []):
                url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}"
                results.append(
                    SearchResult(
                        url=url,
                        title=hit.get("title", ""),
                        snippet=(hit.get("story_text") or "")[:300],
                    )
                )
    except Exception as exc:
        logger.warning("HN search failed for %r: %s", company_name, exc)
    return results


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
                content_md = html_to_markdown(html)
                documents.append(
                    SourceDocument(
                        url=url,
                        title=title_map.get(url, ""),
                        content=text.strip(),
                        fetch_date=now,
                        content_md=content_md,
                    )
                )
        except Exception as e:
            logger.debug(f"Extraction failed for {url}: {e}")

    logger.info(
        f"Extracted content from {len(documents)}/{len(search_results)} URLs"
    )
    return documents


async def fetch_custom_source(url: str) -> SourceDocument | None:
    """Fetch a single URL and return as a SourceDocument."""
    try:
        async with httpx.AsyncClient(
            timeout=FETCH_TIMEOUT,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0"},
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html_text = resp.text
            text = trafilatura.extract(html_text) or ""
            content_md = html_to_markdown(html_text)
            # Simple title extraction from HTML
            import re
            title_match = re.search(r"<title[^>]*>([^<]+)</title>", html_text, re.I)
            title = title_match.group(1).strip() if title_match else url
            if text:
                return SourceDocument(
                    url=url,
                    title=title,
                    content=text[:MAX_CONTENT_PER_SOURCE],
                    fetch_date=datetime.now(timezone.utc),
                    content_md=content_md[:MAX_CONTENT_PER_SOURCE * 2],
                )
    except Exception as exc:
        logger.warning("Failed to fetch custom source %s: %s", url, exc)
    return None


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


async def research_company_full(
    company_name: str,
    founder_names: list[str] | None = None,
    social_handles: dict[str, str] | None = None,
) -> tuple[ResearchContext, list[SearchResult], list[SearchResult], list[SearchResult]]:
    """Full research: web + LinkedIn + Twitter + HN."""
    # Web research (existing)
    web_context = await research_company(company_name)

    # Docs search (supplement web research with developer documentation)
    doc_results = await asyncio.to_thread(_search_docs, company_name)
    if doc_results:
        doc_documents = await fetch_and_extract(doc_results)
        web_context.sources.extend(doc_documents)
        logger.info(
            f"Added {len(doc_documents)} documentation sources for '{company_name}'"
        )

    # Social searches
    linkedin_results = await asyncio.to_thread(
        search_social_linkedin, company_name, founder_names
    )
    twitter_handles = []
    if social_handles:
        if social_handles.get("twitter"):
            twitter_handles.append(social_handles["twitter"])
    twitter_results = await asyncio.to_thread(
        search_social_twitter, company_name, founder_names, twitter_handles
    )
    hn_results = await search_hackernews(company_name)

    return web_context, linkedin_results, twitter_results, hn_results
