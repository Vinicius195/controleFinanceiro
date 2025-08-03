'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, QueryConstraint } from 'firebase/firestore'; // Importando QueryConstraint
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResumoFinanceiroProps {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  contaId: string | null; // Adicionando a prop contaId
}

export default function ResumoFinanceiro({ periodo, contaId }: ResumoFinanceiroProps) {
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!periodo.inicio || !periodo.fim) return;

    setLoading(true);
    
    // Construindo a consulta dinamicamente
    let queryConstraints: QueryConstraint[] = [
        where('createdAt', '>=', periodo.inicio),
        where('createdAt', '<=', periodo.fim)
    ];

    // Adiciona o filtro de conta APENAS se um contaId for fornecido
    if (contaId) {
        queryConstraints.push(where('contaId', '==', contaId));
    }
    
    const q = query(collection(db, 'movimentacoes'), ...queryConstraints);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let entradas = 0;
      let saidas = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.tipo === 'entrada') {
          entradas += data.valor;
        } else {
          saidas += data.valor;
        }
      });

      setTotalEntradas(entradas);
      setTotalSaidas(saidas);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [periodo, contaId]); // Adicionando contaId como dependência

  const saldo = totalEntradas - totalSaidas;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8 w-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
        </CardHeader>
        <CardContent>
           {loading ? <p>...</p> : <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEntradas)}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
        </CardHeader>
        <CardContent>
           {loading ? <p>...</p> : <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSaidas)}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
        </CardHeader>
        <CardContent>
           {loading ? <p>...</p> : <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatCurrency(saldo)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
