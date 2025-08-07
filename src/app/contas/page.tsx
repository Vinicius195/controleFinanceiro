'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { MoreHorizontal } from "lucide-react";
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { getSaoPauloTime } from '@/lib/date-utils';

// Componentes e Utilitários
import FiltroPeriodo from '@/components/FiltroPeriodo';
import { formatCurrency, formatPercentage } from '@/lib/utils';

// Modelos e Config do Firebase
import { ContaBancaria, ContaBancariaSchema } from '@/models/ContaBancaria';
import { Movimentacao } from '@/models/Movimentacao';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, doc, writeBatch, where, getDocs, Timestamp } from 'firebase/firestore';

// Componentes Shadcn/UI
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FormValues = Omit<ContaBancaria, 'id'>;

// Tipo atualizado para guardar os dois saldos calculados
type ContaComSaldosCalculados = ContaBancaria & {
  saldoInicialPeriodo: number;
  saldoFinalPeriodo: number;
};

export default function ContasBancariasPage() {
  const { toast } = useToast();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contasComSaldos, setContasComSaldos] = useState<ContaComSaldosCalculados[]>([]);
  const [loadingContas, setLoadingContas] = useState(true);
  const [loadingSaldos, setLoadingSaldos] = useState(false);
  
  const [contaParaExcluir, setContaParaExcluir] = useState<ContaBancaria | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [periodo, setPeriodo] = useState<{ from: Date; to: Date } | null>(null);

  useEffect(() => {
    // Define o período inicial apenas no lado do cliente
    setPeriodo({
      from: startOfMonth(getSaoPauloTime()),
      to: endOfMonth(getSaoPauloTime()),
    });
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ContaBancariaSchema.omit({ id: true })),
    defaultValues: { nome: '', banco: '', saldoInicial: 0 }
  });
  
  // Busca inicial das contas bancárias
  useEffect(() => {
    const q = query(collection(db, 'contasBancarias'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const contasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContaBancaria));
      setContas(contasData);
      setLoadingContas(false);
    }, (error) => {
      console.error("Erro ao buscar contas: ", error);
      toast({ title: "Erro de Carregamento", description: "Não foi possível buscar as contas bancárias.", variant: "destructive"});
      setLoadingContas(false);
    });
    return () => unsubscribe();
  }, [toast]);

  // Lógica de cálculo de saldos atualizada
  const calcularSaldos = useCallback(async () => {
    if (!periodo || contas.length === 0) {
      setContasComSaldos([]);
      return;
    }

    setLoadingSaldos(true);

    const movSnapshot = await getDocs(collection(db, "movimentacoes"));
    const todasAsMovimentacoes = movSnapshot.docs.map(doc => {
      const data = doc.data();
      // Converte o Timestamp do Firestore para um objeto Date do JavaScript
      return {
        ...data,
        id: doc.id,
        data: (data.data as Timestamp).toDate(),
      } as Movimentacao & { id: string; data: Date };
    });

    const contasAtualizadas = contas.map(conta => {
      const movimentacoesDaConta = todasAsMovimentacoes.filter(mov => mov.contaId === conta.id);

      const saldoInicialPeriodo = movimentacoesDaConta
        .filter(mov => mov.data < periodo.from)
        .reduce((acc, mov) => mov.tipo === 'entrada' ? acc + mov.valor : acc - mov.valor, conta.saldoInicial);

      const saldoFinalPeriodo = movimentacoesDaConta
        .filter(mov => mov.data >= periodo.from && mov.data <= periodo.to)
        .reduce((acc, mov) => mov.tipo === 'entrada' ? acc + mov.valor : acc - mov.valor, saldoInicialPeriodo);

      return { ...conta, saldoInicialPeriodo, saldoFinalPeriodo };
    });

    setContasComSaldos(contasAtualizadas);
    setLoadingSaldos(false);
  }, [contas, periodo]);

  useEffect(() => {
    calcularSaldos();
  }, [calcularSaldos]);


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await addDoc(collection(db, 'contasBancarias'), {
        ...data,
        saldoInicial: Number(data.saldoInicial),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Sucesso!", description: `A conta "${data.nome}" foi criada.` });
      reset();
    } catch (e) {
      toast({ title: "Erro!", description: "Não foi possível criar a conta.", variant: "destructive" });
    }
  };

  const openDeleteDialog = (conta: ContaBancaria) => {
    setContaParaExcluir(conta);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setContaParaExcluir(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!contaParaExcluir || !contaParaExcluir.id) return;
    
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      const movQuery = query(collection(db, "movimentacoes"), where("contaId", "==", contaParaExcluir.id));
      const movSnapshot = await getDocs(movQuery);
      movSnapshot.forEach(doc => batch.delete(doc.ref));
      
      const salQuery = query(collection(db, "salarios"), where("contaDebitoId", "==", contaParaExcluir.id));
      const salSnapshot = await getDocs(salQuery);
      salSnapshot.forEach(doc => batch.delete(doc.ref));

      const contaRef = doc(db, 'contasBancarias', contaParaExcluir.id);
      batch.delete(contaRef);

      await batch.commit();
      toast({ title: "Sucesso!", description: `A conta "${contaParaExcluir.nome}" foi excluída.` });
      
    } catch (e) {
      toast({ title: "Erro!", description: "Não foi possível excluir a conta.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      handleDialogClose();
    }
  };
  
  const handlePeriodoChange = (from: Date, to: Date) => {
    setPeriodo({ from, to });
  };


  return (
    <>
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Contas Bancárias</h1>
          <Button asChild><Link href="/">Voltar ao Dashboard</Link></Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader><CardTitle>Adicionar Nova Conta</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Conta</Label>
                    <Input id="nome" {...register('nome')} placeholder="Ex: Caixa da Pizzaria" />
                    {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco (Opcional)</Label>
                    <Input id="banco" {...register('banco')} placeholder="Ex: Bradesco, Itaú" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saldoInicial">Saldo Inicial (R$)</Label>
                    <Input id="saldoInicial" type="number" step="0.01" {...register('saldoInicial', { valueAsNumber: true })} />
                    {errors.saldoInicial && <p className="text-sm text-red-500">{errors.saldoInicial.message}</p>}
                  </div>
                  <Button type="submit" className="w-full">Salvar Conta</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle>Contas Cadastradas</CardTitle>
                    {periodo && <FiltroPeriodo onFilterChange={handlePeriodoChange} />}
                </div>
              </CardHeader>
              <CardContent>
                {(loadingContas || loadingSaldos || !periodo) ? <p>Carregando...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Saldo Início Período</TableHead>
                        <TableHead className="text-right">Saldo Fim Período</TableHead>
                        <TableHead className="text-right">Variação (%)</TableHead>
                        <TableHead className="text-right w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contasComSaldos.map((conta) => {
                        const variacao = conta.saldoInicialPeriodo !== 0
                            ? ((conta.saldoFinalPeriodo - conta.saldoInicialPeriodo) / conta.saldoInicialPeriodo)
                            : (conta.saldoFinalPeriodo > 0 ? Infinity : 0);
                        const variacaoColor = variacao > 0 ? 'text-green-500' : variacao < 0 ? 'text-red-500' : 'text-gray-500';

                        return (
                            <TableRow key={conta.id}>
                            <TableCell className="font-medium">{conta.nome}</TableCell>
                            <TableCell className="text-right">{formatCurrency(conta.saldoInicialPeriodo)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(conta.saldoFinalPeriodo)}</TableCell>
                            <TableCell className={`text-right font-bold ${variacaoColor}`}>
                                {isFinite(variacao) ? formatPercentage(variacao) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openDeleteDialog(conta)} className="text-red-600">
                                    Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Atenção: Excluir a conta <span className="font-bold">"{contaParaExcluir?.nome}"</span> é uma ação irreversível. Todos os dados associados (movimentações, salários) serão <span className="font-bold text-red-600">permanentemente excluídos</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogClose}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir Tudo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
