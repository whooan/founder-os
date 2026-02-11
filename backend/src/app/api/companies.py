from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.api.deps import get_company_service
from app.schemas.company import CompanyCreate, CompanyDetail, CompanyRead, CompanyUpdate
from app.schemas.intelligence import PipelineStatusResponse, AddSourceRequest, CompareQuery
from app.database import get_session
from app.services.company_service import CompanyService

router = APIRouter()


@router.post("/", response_model=CompanyRead, status_code=201)
async def create_company(
    data: CompanyCreate,
    background_tasks: BackgroundTasks,
    service: CompanyService = Depends(get_company_service),
):
    company = await service.create(data)
    # Import here to avoid circular imports at module level
    from app.intelligence.orchestrator import run_full_enrichment

    background_tasks.add_task(run_full_enrichment, company.id)
    return company


@router.get("/", response_model=list[CompanyRead])
async def list_companies(
    skip: int = 0,
    limit: int = 50,
    q: str | None = None,
    service: CompanyService = Depends(get_company_service),
):
    if q:
        return await service.search(q)
    return await service.list_all(skip=skip, limit=limit)


@router.get("/compare")
async def compare_companies(
    ids: str,
    service: CompanyService = Depends(get_company_service),
):
    company_ids = [i.strip() for i in ids.split(",") if i.strip()]
    if not company_ids:
        raise HTTPException(status_code=400, detail="No company IDs provided")
    companies = await service.get_comparison_data(company_ids)

    # Build feature matrix
    import json as _json
    feature_matrix: dict[str, dict[str, bool]] = {}
    for company in companies:
        for product in company.products:
            if product.features:
                try:
                    feats = _json.loads(product.features) if isinstance(product.features, str) else product.features
                    for feat in feats:
                        if feat not in feature_matrix:
                            feature_matrix[feat] = {}
                        feature_matrix[feat][company.id] = True
                except (ValueError, TypeError):
                    pass
    # Fill in False for companies that don't have a feature
    all_company_ids = [c.id for c in companies]
    for feat in feature_matrix:
        for cid in all_company_ids:
            if cid not in feature_matrix[feat]:
                feature_matrix[feat][cid] = False

    # Find primary
    primary_id = None
    for c in companies:
        if c.is_primary:
            primary_id = c.id
            break

    return {
        "companies": companies,
        "feature_matrix": feature_matrix,
        "primary_company_id": primary_id,
    }


@router.post("/compare/chat")
async def compare_chat_endpoint(
    query: CompareQuery,
    session=Depends(get_session),
):
    from app.intelligence.ask import compare_chat
    result = await compare_chat(query, session)
    return result


@router.get("/{company_id}/competitor-clients")
async def get_competitor_clients(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    """Get all known clients of a competitor company."""
    clients = await service.get_competitor_clients(company_id)
    return [
        {
            "id": c.id,
            "client_name": c.client_name,
            "client_domain": c.client_domain,
            "industry": c.industry,
            "region": c.region,
            "company_size": c.company_size,
            "relationship_type": c.relationship_type,
            "source_url": c.source_url,
            "confidence": c.confidence,
            "company_id": c.company_id,
        }
        for c in clients
    ]


@router.post("/{company_id}/find-potential-clients", status_code=202)
async def find_potential_clients(
    company_id: str,
    background_tasks: BackgroundTasks,
    service: CompanyService = Depends(get_company_service),
):
    """Trigger potential clients research for the primary company."""
    company = await service.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if not company.is_primary:
        raise HTTPException(
            status_code=400,
            detail="Potential clients research is only available for the primary company",
        )
    from app.intelligence.orchestrator import run_potential_clients_analysis

    background_tasks.add_task(run_potential_clients_analysis, company_id)
    return {"status": "accepted", "message": "Potential clients research started"}


@router.get("/{company_id}", response_model=CompanyDetail)
async def get_company(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    company = await service.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.delete("/{company_id}", status_code=204)
async def delete_company(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    deleted = await service.delete(company_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Company not found")


@router.patch("/{company_id}", response_model=CompanyRead)
async def update_company(
    company_id: str,
    data: CompanyUpdate,
    service: CompanyService = Depends(get_company_service),
):
    company = await service.update(company_id, data)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.patch("/{company_id}/primary", response_model=CompanyRead)
async def set_primary_company(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    company = await service.set_primary(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/{company_id}/sources", status_code=201)
async def add_custom_source(
    company_id: str,
    data: AddSourceRequest,
    background_tasks: BackgroundTasks,
    service: CompanyService = Depends(get_company_service),
):
    from app.intelligence.research import fetch_custom_source

    source = await fetch_custom_source(data.url)
    if not source:
        raise HTTPException(status_code=400, detail="Failed to fetch URL")
    ds = await service.add_custom_source(
        company_id,
        url=source.url,
        title=data.title or source.title,
        content=source.content,
        content_md=source.content_md,
    )
    # Trigger digest rerun in background
    from app.intelligence.orchestrator import rerun_with_sources
    background_tasks.add_task(rerun_with_sources, company_id)
    return {"id": ds.id, "url": ds.url, "title": ds.title}


@router.delete("/{company_id}/sources/{source_id}", status_code=204)
async def delete_source(
    company_id: str,
    source_id: str,
    service: CompanyService = Depends(get_company_service),
):
    deleted = await service.delete_source(company_id, source_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Source not found")


@router.post("/{company_id}/rerun", status_code=202)
async def rerun_enrichment(
    company_id: str,
    background_tasks: BackgroundTasks,
    service: CompanyService = Depends(get_company_service),
):
    company = await service.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    from app.intelligence.orchestrator import run_full_enrichment
    background_tasks.add_task(run_full_enrichment, company_id)
    return {"status": "accepted"}


@router.post("/{company_id}/update", status_code=202)
async def incremental_update(
    company_id: str,
    background_tasks: BackgroundTasks,
    service: CompanyService = Depends(get_company_service),
):
    company = await service.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    from app.intelligence.orchestrator import run_incremental_update
    background_tasks.add_task(run_incremental_update, company_id)
    return {"status": "accepted"}


@router.post("/{company_id}/reanalyze", status_code=202)
async def reanalyze_company(
    company_id: str,
    background_tasks: BackgroundTasks,
    service: CompanyService = Depends(get_company_service),
):
    company = await service.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    from app.intelligence.orchestrator import run_intelligence_rerun
    background_tasks.add_task(run_intelligence_rerun, company_id)
    return {"status": "accepted", "message": "Intelligence re-analysis started"}


@router.delete("/{company_id}/social/{post_id}", status_code=204)
async def delete_social_post(
    company_id: str,
    post_id: str,
    service: CompanyService = Depends(get_company_service),
):
    deleted = await service.delete_social_post(company_id, post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Social post not found")


@router.get("/{company_id}/social")
async def get_social_posts(
    company_id: str,
    platform: str | None = None,
    service: CompanyService = Depends(get_company_service),
):
    from sqlalchemy import select
    from app.models.social_post import SocialPost
    from app.database import async_session_factory

    async with async_session_factory() as session:
        stmt = select(SocialPost).where(SocialPost.company_id == company_id)
        if platform:
            stmt = stmt.where(SocialPost.platform == platform)
        stmt = stmt.order_by(SocialPost.created_at.desc())
        result = await session.execute(stmt)
        posts = result.scalars().all()
        return [
            {
                "id": p.id,
                "platform": p.platform,
                "author": p.author,
                "content": p.content,
                "url": p.url,
                "posted_at": p.posted_at.isoformat() if p.posted_at else None,
                "raw_content_md": p.raw_content_md,
                "company_id": p.company_id,
                "founder_id": p.founder_id,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in posts
        ]


@router.get("/{company_id}/digest")
async def get_digest(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    from sqlalchemy import select
    from app.models.company_digest import CompanyDigest
    from app.database import async_session_factory

    async with async_session_factory() as session:
        stmt = (
            select(CompanyDigest)
            .where(CompanyDigest.company_id == company_id)
            .order_by(CompanyDigest.generated_at.desc())
        )
        result = await session.execute(stmt)
        digests = result.scalars().all()
        return [
            {
                "id": d.id,
                "digest_markdown": d.digest_markdown,
                "digest_type": d.digest_type,
                "generated_at": d.generated_at.isoformat() if d.generated_at else None,
                "company_id": d.company_id,
            }
            for d in digests
        ]


@router.get("/{company_id}/status", response_model=PipelineStatusResponse)
async def get_company_status(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    status = await service.get_status(company_id)
    if status == "not_found":
        raise HTTPException(status_code=404, detail="Company not found")
    return PipelineStatusResponse(status=status, company_id=company_id)
