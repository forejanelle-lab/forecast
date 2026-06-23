"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaTrendChart, BarTrendChart } from "@/components/ui/charts";

interface AnalyticsSectionProps {
  monthlySubmissions: Array<{ month: string; submissions: number }>;
  projectsCreated: Array<{ month: string; projects: number }>;
  rolesCreated: Array<{ month: string; roles: number }>;
  callbacks: Array<{ month: string; callbacks: number }>;
  bookings: Array<{ month: string; bookings: number }>;
  reviewTime: Array<{ month: string; hours: number }>;
}

export function AnalyticsSection({
  monthlySubmissions,
  projectsCreated,
  rolesCreated,
  callbacks,
  bookings,
  reviewTime,
}: AnalyticsSectionProps) {
  const charts = [
    {
      title: "Monthly Submissions",
      data: monthlySubmissions,
      dataKey: "submissions",
      type: "area" as const,
    },
    {
      title: "Projects Created",
      data: projectsCreated,
      dataKey: "projects",
      type: "bar" as const,
    },
    {
      title: "Roles Created",
      data: rolesCreated,
      dataKey: "roles",
      type: "bar" as const,
    },
    {
      title: "Callbacks",
      data: callbacks,
      dataKey: "callbacks",
      type: "area" as const,
    },
    {
      title: "Bookings",
      data: bookings,
      dataKey: "bookings",
      type: "area" as const,
    },
    {
      title: "Review Time (hrs)",
      data: reviewTime,
      dataKey: "hours",
      type: "area" as const,
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Analytics</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {charts.map((chart) => (
          <Card key={chart.title} padding="md" hover>
            <CardHeader className="mb-2">
              <CardTitle className="text-base">{chart.title}</CardTitle>
            </CardHeader>
            {chart.type === "area" ? (
              <AreaTrendChart
                data={chart.data}
                dataKey={chart.dataKey}
                xKey="month"
                height={160}
              />
            ) : (
              <BarTrendChart
                data={chart.data}
                dataKey={chart.dataKey}
                xKey="month"
                height={160}
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
