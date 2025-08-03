'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Movimentacao } from '@/models/Movimentacao';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { format } from 'date-fns';

interface GraficoFinanceiroProps {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  contaId: string | null; // Adicionando a prop contaId
}

interface ChartData {
  name: string;
  entradas: number;
  saidas: number;
}

export default function GraficoFinanceiro({ periodo, contaId }: GraficoFinanceiroProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!periodo.inicio || !periodo.fim) return;
    
    setLoading(true);

    // Construindo a consulta dinamicamente
    let queryConstraints: QueryConstraint[] = [
        where('createdAt', '>=', periodo.inicio),
        where('createdAt', '<=', periodo.fim),
        orderBy('createdAt', 'asc')
    ];

    if (contaId) {
        queryConstraints.push(where('contaId', '==', contaId));
    }

    const q = query(collection(db, 'movimentacoes'), ...queryConstraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movimentacoes: Movimentacao[] = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          data: doc.data().data.toDate()
      })) as Movimentacao[];
      
      const processedData = processDataForChart(movimentacoes);
      setChartData(processedData);
      setLoading(false);
    });

    return () => unsubscribe();

  }, [periodo, contaId]); // Adicionando contaId como dependência

  const processDataForChart = (movimentacoes: Movimentacao[]): ChartData[] => {
    const groupedByDay = movimentacoes.reduce((acc, mov) => {
      const day = format(new Date(mov.data), 'dd/MM');
      if (!acc[day]) {
        acc[day] = { entradas: 0, saidas: 0 };
      }
      if (mov.tipo === 'entrada') {
        acc[day].entradas += mov.valor;
      } else {
        acc[day].saidas += mov.valor;
      }
      return acc;
    }, {} as Record<string, { entradas: number, saidas: number }>);

    return Object.keys(groupedByDay).map(day => ({
      name: day,
      entradas: groupedByDay[day].entradas,
      saidas: groupedByDay[day].saidas,
    }));
  };

  const formatCurrencyForTooltip = (value: number) => {
     return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle>Evolução Financeira no Período</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="h-[350px] w-full flex items-center justify-center">
                <p>Carregando gráfico...</p>
            </div>
        ) : (
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                    <Tooltip formatter={formatCurrencyForTooltip}/>
                    <Legend />
                    <Line type="monotone" dataKey="entradas" stroke="#16a34a" activeDot={{ r: 8 }} name="Entradas"/>
                    <Line type="monotone" dataKey="saidas" stroke="#dc2626" name="Saídas"/>
                </LineChart>
                </ResponsiveContainer>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
