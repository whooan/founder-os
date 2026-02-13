"""Daily auto-update scheduler using APScheduler."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import async_session
from app.intelligence.orchestrator import run_incremental_update
from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)

JOB_ID = "daily_update"

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
    return _scheduler


async def _daily_update_job() -> None:
    """Run incremental update for all enriched companies."""
    logger.info("Daily auto-update starting...")
    try:
        async with async_session() as session:
            from app.services.company_service import CompanyService

            service = CompanyService(session)
            companies = await service.list_all(limit=100)

        updated = 0
        for company in companies:
            if company.status not in ("enriched", "error"):
                continue
            try:
                logger.info("Updating %s ...", company.name)
                await run_incremental_update(company.id)
                updated += 1
            except Exception:
                logger.exception("Failed to update %s", company.name)

        # Record last run timestamp
        async with async_session() as session:
            svc = SettingsService(session)
            await svc.set(
                "last_daily_update",
                datetime.now(timezone.utc).isoformat(),
            )

        logger.info("Daily auto-update finished. Updated %d companies.", updated)
    except Exception:
        logger.exception("Daily auto-update job failed")


async def sync_scheduler() -> None:
    """Read settings from DB and sync the scheduler job accordingly."""
    scheduler = get_scheduler()
    async with async_session() as session:
        svc = SettingsService(session)
        enabled = (await svc.get("auto_update_enabled")) == "true"
        hour_str = await svc.get("auto_update_hour")
        hour = int(hour_str) if hour_str else 7  # default 7 AM UTC

    existing = scheduler.get_job(JOB_ID)

    if enabled:
        trigger = CronTrigger(hour=hour, minute=0, timezone="UTC")
        if existing:
            scheduler.reschedule_job(JOB_ID, trigger=trigger)
            logger.info("Rescheduled daily update to %02d:00 UTC", hour)
        else:
            scheduler.add_job(
                _daily_update_job,
                trigger=trigger,
                id=JOB_ID,
                name="Daily company update",
                replace_existing=True,
            )
            logger.info("Scheduled daily update at %02d:00 UTC", hour)
    elif existing:
        scheduler.remove_job(JOB_ID)
        logger.info("Disabled daily auto-update")


async def start_scheduler() -> None:
    """Start the scheduler and sync from settings."""
    scheduler = get_scheduler()
    scheduler.start()
    await sync_scheduler()
    logger.info("Scheduler started")


def stop_scheduler() -> None:
    """Shut down the scheduler."""
    scheduler = get_scheduler()
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
