"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

const chartConfig = {
  engagement: {
    label: "Engagement",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

type CampaignGrowthChartPoint = {
  date: string
  label: string
  engagement: number
}

type CampaignGrowthChartProps = {
  data: CampaignGrowthChartPoint[]
}

function toDateValue(value: string) {
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export function CampaignGrowthChart({ data }: CampaignGrowthChartProps) {
  const [timeRange, setTimeRange] = React.useState("14d")

  const filteredData = React.useMemo(() => {
    if (!data.length) {
      return []
    }

    const datedItems = data
      .map((item) => ({
        ...item,
        parsedDate: toDateValue(item.date),
      }))
      .filter((item) => item.parsedDate !== null)

    if (!datedItems.length) {
      return data
    }

    const referenceDate = new Date(
      Math.max(...datedItems.map((item) => item.parsedDate!.getTime())),
    )
    let daysToSubtract = 14

    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return datedItems
      .filter((item) => item.parsedDate! >= startDate)
      .map((item) => ({
        date: item.date,
        engagement: item.engagement,
        label: item.label,
      }))
  }, [data, timeRange])

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>
            Campaign performance
          </CardTitle>
          <CardDescription>
            Daily engagement trend across published campaign posts.
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value ?? "14d")}>
          <SelectTrigger
            className="hidden w-[140px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select campaign time range"
          >
            <SelectValue placeholder="Last 14 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="14d" className="rounded-lg">
              Last 14 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[120px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-engagement)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-engagement)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="engagement"
              type="natural"
              fill="url(#fillEngagement)"
              stroke="var(--color-engagement)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
