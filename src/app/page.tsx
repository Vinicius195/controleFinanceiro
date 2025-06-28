'use client';

import { useState, useMemo, useEffect } from "react";
import { useFinancialData } from "@/contexts/FinancialDataContext";
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
  Building,
  Truck,
  ShoppingBasket,
  PiggyBank,
  Wrench,
  Landmark,
  CircleHelp,
} from "lucide-react";
import { FinancialForm } from "@/components/financial-form";
import { ProfitChart } from "@/components/profit-chart";
import { MainHeader } from "@/components/main-header";

export default function Home() {
  const { getAggregatedData, entries } = useFinancialData();
  const [aggregatedData, setAggregatedData] = useState(getAggregatedData());
  
  // Recalculate when entries change
  useEffect(() => {
    setAggregatedData(getAggregatedData());
  }, [entries, getAggregatedData]);


  const [simulatedData, setSimulatedData] = useState<Omit<FinancialRecommendationsInput, 'revenue' | 'expenses'>>({
    dineInRevenue: aggregatedData.dineInRevenue,
    deliveryRevenue: aggregatedData.deliveryRevenue,
    takeoutRevenue: aggregatedData.takeoutRevenue,
    ingredientCosts: aggregatedData.ingredientCosts,
    wageCosts: aggregatedData.wageCosts,
    rentCosts: aggregatedData.rentCosts,
    pricingStrategy: "O preço médio por pizza é de R$55. Oferecemos 10% de desconto em pedidos acima de R$120.",
    recipes: "1. Pizza de Calabresa: Molho, muçarela, calabresa e cebola.\n2. Pizza de Frango com Catupiry: Molho, muçarela, frango desfiado e catupiry.\n3. Pizza Margherita: Molho, muçarela, tomate e manjericão.",
  });

  // Update simulation form when real data changes
  useEffect(() => {
    setSimulatedData(prev => ({
        ...prev, // keep strategy and recipes
        dineInRevenue: aggregatedData.dineInRevenue,
        deliveryRevenue: aggregatedData.deliveryRevenue,
        takeoutRevenue: aggregatedData.takeoutRevenue,
        ingredientCosts: aggregatedData.ingredientCosts,
        wageCosts: aggregatedData.wageCosts,
        rentCosts: aggregatedData.rentCosts,
    }));
  }, [aggregatedData]);
  
  const handleDataChange = (newData: Omit<FinancialRecommendationsInput, 'revenue' | 'expenses'>) => {
    setSimulatedData(newData);
  };

  const revenue = aggregatedData.totalRevenue;
  const expenses = aggregatedData.totalExpenses;
  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const formatCurrency = (value: number) => {
    if (isNaN(value)) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0);
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const kpiData = [
    { title: "Receita Total", value: formatCurrency(revenue), icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
    { title: "Despesas Totais", value: formatCurrency(expenses), icon: <TrendingDown className="h-4 w-4 text-muted-foreground" /> },
    { title: "Lucro", value: formatCurrency(profit), icon: <TrendingUp className="h-4 w-4 text-muted-foreground" /> },
    { title: "Margem de Lucro", value: `${profitMargin.toFixed(1)}%`, icon: <Pizza className="h-4 w-4 text-muted-foreground" /> },
  ];

  const revenueData = [
    { category: "Vendas no Salão", amount: formatCurrency(aggregatedData.dineInRevenue), icon: <Building className="h-5 w-5 text-muted-foreground" /> },
    { category: "Vendas por Delivery", amount: formatCurrency(aggregatedData.deliveryRevenue), icon: <Truck className="h-5 w-5 text-muted-foreground" /> },
    { category: "Vendas para Retirada", amount: formatCurrency(aggregatedData.takeoutRevenue), icon: <ShoppingBasket className="h-5 w-5 text-muted-foreground" /> },
  ];

  const expenseData = [
    { category: "Ingredientes", amount: formatCurrency(aggregatedData.ingredientCosts), icon: <PiggyBank className="h-5 w-5 text-muted-foreground" /> },
    { category: "Salários", amount: formatCurrency(aggregatedData.wageCosts), icon: <Wrench className="h-5 w-5 text-muted-foreground" /> },
    { category: "Aluguel e Contas", amount: formatCurrency(aggregatedData.rentCosts), icon: <Landmark className="h-5 w-5 text-muted-foreground" /> },
    { category: "Outros Custos", amount: formatCurrency(aggregatedData.otherCosts), icon: <CircleHelp className="h-5 w-5 text-muted-foreground" /> },
  ];
  
  const fullFinancialDataForAI: FinancialRecommendationsInput = {
    ...simulatedData,
    revenue: simulatedData.dineInRevenue + simulatedData.deliveryRevenue + simulatedData.takeoutRevenue,
    expenses: simulatedData.ingredientCosts + simulatedData.wageCosts + simulatedData.rentCosts,
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <MainHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{kpi.value}</div></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-7 md:gap-8">
          <div className="md:col-span-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Detalhamento da Receita</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                {revenueData.map((item) => (
                                <TableRow key={item.category}>
                                    <TableCell className="font-medium flex items-center gap-2">{item.icon} {item.category}</TableCell>
                                    <TableCell className="text-right">{item.amount}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Categorias de Despesa</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                {expenseData.map((item) => (
                                <TableRow key={item.category}>
                                    <TableCell className="font-medium flex items-center gap-2">{item.icon} {item.category}</TableCell>
                                    <TableCell className="text-right">{item.amount}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             <Card>
              <CardHeader>
                <CardTitle>Lucro Histórico</CardTitle>
                <CardDescription>Análise do seu lucro com base nos dados diários inseridos.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfitChart data={entries} />
              </CardContent>
            </Card>
          </div>
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-accent" />Consultor Financeiro de IA</CardTitle>
              <CardDescription>Ajuste os valores para simular cenários e obter recomendações da IA com base nos seus dados reais.</CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialForm data={fullFinancialDataForAI} onDataChange={handleDataChange} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
