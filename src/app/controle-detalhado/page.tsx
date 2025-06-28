'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useFinancialData, DailyEntry } from '@/contexts/FinancialDataContext';
import { MainHeader } from '@/components/main-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DailyEntryForm } from '@/components/daily-entry-form';

export default function DetailedControlPage() {
  const { entries } = useFinancialData();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const currentWeekEntries = useMemo(() => {
    return entries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        // Adjust for timezone issues by comparing dates as strings
        const entryDateStr = format(entryDate, 'yyyy-MM-dd');
        const weekStartDateStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndDateStr = format(weekEnd, 'yyyy-MM-dd');
        return entryDateStr >= weekStartDateStr && entryDateStr <= weekEndDateStr;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, weekStart, weekEnd]);
  
  const weeklyChartData = useMemo(() => {
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return daysInWeek.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = currentWeekEntries.find(e => e.date === dateStr);
      const revenue = entry ? entry.dineInRevenue + entry.deliveryRevenue + entry.takeoutRevenue : 0;
      const expenses = entry ? entry.ingredientCosts + entry.wageCosts + entry.rentCosts + entry.otherCosts : 0;
      return {
        name: format(day, 'EEE', { locale: ptBR }),
        Receita: revenue,
        Despesa: expenses,
      };
    });
  }, [currentWeekEntries, weekStart, weekEnd]);


  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handlePrevWeek = () => setSelectedDate(subWeeks(selectedDate, 1));
  const handleNextWeek = () => setSelectedDate(addWeeks(selectedDate, 1));
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <MainHeader />
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Controle Detalhado</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
                <DailyEntryForm />
            </div>

            <div className="md:col-span-2 space-y-4">
                 <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                             <div>
                                <CardTitle>Resumo da Semana</CardTitle>
                                <CardDescription>
                                    {format(weekStart, "dd 'de' MMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                                </CardDescription>
                             </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={handlePrevWeek}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" stroke="hsl(var(--foreground))" opacity={0.6} fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="hsl(var(--foreground))" opacity={0.6} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `R$${value/1000}k`} />
                                <Tooltip
                                    cursor={{ fill: "hsl(var(--accent) / 0.2)" }}
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }}
                                />
                                <Legend wrapperStyle={{fontSize: "12px"}}/>
                                <Bar dataKey="Receita" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Despesa" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Lançamentos da Semana</CardTitle></CardHeader>
                    <CardContent>
                        <div className="relative h-64 overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="text-right">Receita</TableHead>
                                        <TableHead className="text-right">Despesa</TableHead>
                                        <TableHead className="text-right">Lucro</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentWeekEntries.length > 0 ? currentWeekEntries.map(entry => {
                                        const revenue = entry.dineInRevenue + entry.deliveryRevenue + entry.takeoutRevenue;
                                        const expenses = entry.ingredientCosts + entry.wageCosts + entry.rentCosts + entry.otherCosts;
                                        const profit = revenue - expenses;
                                        return (
                                            <TableRow key={entry.date}>
                                                <TableCell>{format(new Date(entry.date.replace(/-/g, '/')), "dd/MM/yy (EEE)", { locale: ptBR })}</TableCell>
                                                <TableCell className="text-right text-emerald-500">{formatCurrency(revenue)}</TableCell>
                                                <TableCell className="text-right text-red-500">{formatCurrency(expenses)}</TableCell>
                                                <TableCell className={`text-right font-bold ${profit >= 0 ? 'text-sky-500' : 'text-red-500'}`}>{formatCurrency(profit)}</TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">Nenhum lançamento nesta semana.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
