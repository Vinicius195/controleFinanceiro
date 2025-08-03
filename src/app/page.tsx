'use client';

import { useState } from 'react';
import Link from 'next/link';
import { subDays } from 'date-fns';
import { PlusCircle } from 'lucide-react';

// Componentes
import MovimentacaoForm from '../components/MovimentacaoForm';
import ListaMovimentacoes from '../components/ListaMovimentacoes';
import ResumoFinanceiro from '../components/ResumoFinanceiro';
import FiltroPeriodo from '../components/FiltroPeriodo';
import FiltroConta from '../components/FiltroConta';
import GraficoFinanceiro from '../components/GraficoFinanceiro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

export default function HomePage() {
  const [periodo, setPeriodo] = useState({
    inicio: subDays(new Date(), 30),
    fim: new Date(),
  });
  
  const [contaId, setContaId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
            <p className="text-muted-foreground">Visão geral das suas finanças.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/despesas-fixas">Despesas Fixas</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/socios">Divisão de Lucros</Link></Button>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Movimentação</DialogTitle>
                  <DialogDescription>
                    Registre uma nova entrada ou saída no seu fluxo de caixa.
                  </DialogDescription>
                </DialogHeader>
                <MovimentacaoForm onSave={() => setIsFormOpen(false)} />
              </DialogContent>
            </Dialog>
          </nav>
        </div>
      </header>

      {/* Filtros e Resumo */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Filtros e Período</CardTitle>
            <CardDescription>Selecione a conta e o período para visualizar os dados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-end">
            <FiltroPeriodo onFilterChange={handleFilterChange} />
            <FiltroConta onAccountChange={handleAccountChange} />
          </CardContent>
        </Card>
      </section>
      
      {/* Resumo Financeiro */}
      <ResumoFinanceiro periodo={periodo} contaId={contaId} />
      
      {/* Gráfico e Lista de Movimentações */}
      <div className="grid grid-cols-1 gap-8 mt-8">
        <GraficoFinanceiro periodo={periodo} contaId={contaId} />
        <ListaMovimentacoes periodo={periodo} contaId={contaId} />
      </div>

      {/* Navegação Secundária */}
      <footer className="mt-8 pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-4">Acesso rápido às áreas de gestão:</p>
        <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary"><Link href="/categorias">Gerenciar Categorias</Link></Button>
            <Button asChild variant="secondary"><Link href="/contas">Gerenciar Contas</Link></Button>
        </div>
      </footer>
    </div>
  );
}
