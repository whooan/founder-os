"use client";

import { useRef, useState, useEffect } from "react";
import { Loader2, AlertTriangle, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MarketGraph,
  MarketGraphLegend,
} from "@/components/market/market-graph";
import { useMarketMap } from "@/hooks/use-market-map";

export default function MarketPage() {
  const { data, loading, error } = useMarketMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: Math.max(500, rect.height),
        });
      }
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Market Map</h2>
          <p className="text-sm text-muted-foreground">
            Visualize relationships between companies, investors, and categories
          </p>
        </div>
        <MarketGraphLegend />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0" ref={containerRef}>
          {error ? (
            <div className="flex h-[500px] flex-col items-center justify-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex h-[500px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.nodes.length === 0 ? (
            <div className="flex h-[500px] flex-col items-center justify-center gap-3">
              <Network className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold">No market data yet</p>
                <p className="text-sm text-muted-foreground">
                  Add companies to see relationships on the market map.
                </p>
              </div>
            </div>
          ) : (
            <MarketGraph
              data={data}
              width={dimensions.width}
              height={dimensions.height}
            />
          )}
        </CardContent>
      </Card>

      {data && data.nodes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {data.nodes.filter((n) => n.type === "company").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Investors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {data.nodes.filter((n) => n.type === "investor").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.links.length}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
