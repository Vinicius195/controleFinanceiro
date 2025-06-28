'use client';

import { useState } from "react";
import type { FinancialRecommendationsInput } from "@/ai/schemas/financial-recommendations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Pizza,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
} from "lucide-react";
import { FinancialForm } from "@/components/financial-form";
import { ProfitChart } from "@/components/profit-chart";

export default function Home() {
  const [financialData, setFinancialData] = useState<FinancialRecommendationsInput>({
    revenue: 45000,
    expenses: 28000,
    ingredientCosts: 12000,
    wageCosts: 10000,
    rentCosts: 6000,
    pricingStrategy: "O preço médio por pizza é de R$55. Oferecemos 10% de desconto em pedidos acima de R$120.",
  });
  
  const handleDataChange = (newData: FinancialRecommendationsInput) => {
    setFinancialData(newData);
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value)) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0);
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const profit = financialData.revenue - financialData.expenses;
  const profitMargin = financialData.revenue > 0 ? (profit / financialData.revenue) * 100 : 0;

  const kpiData = [
    {
      title: "Receita Total",
      value: formatCurrency(financialData.revenue),
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Despesas Totais",
      value: formatCurrency(financialData.expenses),
      icon: <TrendingDown className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Lucro",
      value: formatCurrency(profit),
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Margem de Lucro",
      value: `${profitMargin.toFixed(1)}%`,
      icon: <Pizza className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  const expenseData = [
    { category: "Ingredientes", amount: formatCurrency(financialData.ingredientCosts) },
    { category: "Salários", amount: formatCurrency(financialData.wageCosts) },
    { category: "Aluguel e Contas", amount: formatCurrency(financialData.rentCosts) },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Pizza className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-headline">PizzaBela Massa</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-7 md:gap-8">
          <div className="md:col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Margem de Lucro ao Longo do Tempo</CardTitle>
                <CardDescription>
                  Uma análise das suas tendências de lucro nos últimos 7 meses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfitChart />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Categorias de Despesa</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseData.map((item) => (
                      <TableRow key={item.category}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">
                          {item.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-accent" />
                Consultor Financeiro de IA
              </CardTitle>
              <CardDescription>
                Insira seus dados para ver o painel se atualizar e obter recomendações da IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialForm data={financialData} onDataChange={handleDataChange} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}