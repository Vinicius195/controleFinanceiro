'use client';

import { useState } from 'react';
import Link from 'next/link';
import { subDays } from 'date-fns';

// Componentes
import MovimentacaoForm from '../components/MovimentacaoForm';
import ListaMovimentacoes from '../components/ListaMovimentacoes';
import ResumoFinanceiro from '../components/ResumoFinanceiro';
import FiltroPeriodo from '../components/FiltroPeriodo';
import FiltroConta from '../components/FiltroConta';
import GraficoFinanceiro from '../components/GraficoFinanceiro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const [periodo, setPeriodo] = useState({
    inicio: subDays(new Date(), 30),
    fim: new Date(),
  });
  
  const [contaId, setContaId] = useState<string | null>(null);

  const handleFilterChange = (inicio: Date, fim: Date) => {
    const adjustedFim = new Date(fim);
    adjustedFim.setHours(23, 59, 59, 999);
    setPeriodo({ inicio, fim: adjustedFim });
  };
  
  const handleAccountChange = (accountId: string | null) => {
    setContaId(accountId);
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <nav className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/categorias">Gerenciar Categorias</Link></Button>
            <Button asChild variant="outline"><Link href="/contas">Gerenciar Contas</Link></Button>
            <Button asChild variant="outline"><Link href="/socios">Divisão de Lucros</Link></Button>
            <Button asChild variant="outline"><Link href="/despesas-fixas">Despesas Fixas</Link></Button>
          </nav>
        </div>
      </header>
      
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-end">
            <FiltroPeriodo onFilterChange={handleFilterChange} />
            <FiltroConta onAccountChange={handleAccountChange} />
          </CardContent>
        </Card>
      </section>
      
      <ResumoFinanceiro periodo={periodo} contaId={contaId} />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 my-8">
        <GraficoFinanceiro periodo={periodo} contaId={contaId} />
        <MovimentacaoForm />
      </div>

      <ListaMovimentacoes periodo={periodo} contaId={contaId} />
    </div>
  );
}
