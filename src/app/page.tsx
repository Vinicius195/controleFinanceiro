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

const kpiData = [
  {
    title: "Receita Total",
    value: "R$45.231,89",
    change: "+20.1% do último mês",
    icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Despesas Totais",
    value: "R$28.123,50",
    change: "+18.1% do último mês",
    icon: <TrendingDown className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Lucro",
    value: "R$17.108,39",
    change: "+22.4% do último mês",
    icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Margem de Lucro",
    value: "37.8%",
    change: "+1.2% do último mês",
    icon: <Pizza className="h-4 w-4 text-muted-foreground" />,
  },
];

const revenueData = [
  { channel: "Pedidos Online", amount: "R$15.231,50" },
  { channel: "Na Loja", amount: "R$25.000,39" },
  { channel: "Catering", amount: "R$5.000,00" },
];

const expenseData = [
  { category: "Ingredientes", amount: "R$12.500,00" },
  { category: "Salários", amount: "R$10.623,50" },
  { category: "Aluguel e Contas", amount: "R$5.000,00" },
];

export default function Home() {
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
                <p className="text-xs text-muted-foreground">{kpi.change}</p>
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
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Canais de Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Canal</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueData.map((item) => (
                        <TableRow key={item.channel}>
                          <TableCell>{item.channel}</TableCell>
                          <TableCell className="text-right">
                            {item.amount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
          </div>
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-accent" />
                Consultor Financeiro de IA
              </CardTitle>
              <CardDescription>
                Insira seus dados financeiros mais recentes para obter recomendações da IA para melhorar a lucratividade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
