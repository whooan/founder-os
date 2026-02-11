from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.company import Company
from app.models.funding_round import FundingRound
from app.schemas.market import MarketGraphData, MarketGraphLink, MarketGraphNode


class MarketService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def build_graph(self) -> MarketGraphData:
        stmt = (
            select(Company)
            .options(
                selectinload(Company.categories),
                selectinload(Company.funding_rounds).selectinload(
                    FundingRound.investors
                ),
            )
            .where(Company.status != "error")
        )
        result = await self.session.execute(stmt)
        companies = list(result.scalars().all())

        nodes: list[MarketGraphNode] = []
        links: list[MarketGraphLink] = []
        seen_investors: set[str] = set()
        seen_categories: set[str] = set()

        for company in companies:
            nodes.append(
                MarketGraphNode(
                    id=company.id,
                    label=company.name,
                    type="company",
                    size=30,
                )
            )

            # Add category nodes and links
            for cat in company.categories:
                if cat.id not in seen_categories:
                    seen_categories.add(cat.id)
                    nodes.append(
                        MarketGraphNode(
                            id=cat.id,
                            label=cat.name,
                            type="category",
                            size=15,
                        )
                    )
                links.append(
                    MarketGraphLink(
                        source=company.id,
                        target=cat.id,
                        type="same_category",
                        weight=1.0,
                    )
                )

            # Add investor nodes and links
            for fr in company.funding_rounds:
                for inv in fr.investors:
                    if inv.id not in seen_investors:
                        seen_investors.add(inv.id)
                        nodes.append(
                            MarketGraphNode(
                                id=inv.id,
                                label=inv.name,
                                type="investor",
                                size=20,
                            )
                        )
                    links.append(
                        MarketGraphLink(
                            source=inv.id,
                            target=company.id,
                            type="invested_in",
                            weight=1.0,
                        )
                    )

        return MarketGraphData(nodes=nodes, links=links)
