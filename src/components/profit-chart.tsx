"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  ComposedChart
} from "recharts";
import { useMemo } from 'react';
import type { DailyEntry } from '@/contexts/FinancialDataContext';

interface ProfitChartProps {
    data: DailyEntry[];
}

export function ProfitChart({ data }: ProfitChartProps) {
  const chartData = useMemo(() => {
    return data.map(entry => {
        const revenue = entry.dineInRevenue + entry.deliveryRevenue + entry.takeoutRevenue;
        const expenses = entry.ingredientCosts + entry.wageCosts + entry.rentCosts + entry.otherCosts;
        return {
            name: entry.date.substring(5).replace(/-/g, '/'), // Show MM/DD
            Lucro: revenue - expenses,
            Receita: revenue,
            Despesas: expenses,
        }
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [data]);
    
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value / 1000}k`}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent) / 0.2)" }}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
          }}
           formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
        />
        <Bar
          dataKey="Lucro"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
        <Line type="monotone" dataKey="Receita" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
