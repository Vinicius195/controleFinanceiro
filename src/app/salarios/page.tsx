'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { startOfMonth, endOfMonth, set, getDaysInMonth } from 'date-fns';
import { getSaoPauloTime } from '@/lib/date-utils';

// Models
import { Salario, SalarioSchema } from '@/models/Salario';
import { ContaBancaria } from '@/models/ContaBancaria';

// Componentes
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FormValues = Omit<Salario, 'id'>;

export default function SalariosPage() {
  const { toast } = useToast();
  const [salarios, setSalarios] = useState<Salario[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [categoriaSalarioId, setCategoriaSalarioId] = useState<string | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(SalarioSchema.omit({ id: true })),
    defaultValues: { nomeFuncionario: '', valor: 0, diaPagamento: 5, contaDebitoId: '' }
  });

  useEffect(() => {
    const qCategoria = query(collection(db, 'categorias'), where('nome', '==', 'Salários'));
    getDocs(qCategoria).then(snapshot => {
      if (!snapshot.empty) {
        setCategoriaSalarioId(snapshot.docs[0].id);
      } else {
        toast({
          title: "Atenção: Categoria não encontrada",
          description: "A categoria 'Salários' não foi encontrada. Por favor, crie-a para que os lançamentos sejam classificados corretamente.",
          variant: "destructive",
        });
      }
    });

    const qSalarios = query(collection(db, 'salarios'), orderBy('nomeFuncionario', 'asc'));
    const unsubSalarios = onSnapshot(qSalarios, (snapshot) => {
      setSalarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salario)));
      setLoading(false);
    });
    
    const qContas = query(collection(db, 'contasBancarias'), orderBy('nome', 'asc'));
    const unsubContas = onSnapshot(qContas, (s) => setContas(s.docs.map(d => ({ id: d.id, ...d.data() } as ContaBancaria))));

    return () => { unsubSalarios(); unsubContas(); };
  }, [toast]);

  const onFormSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await addDoc(collection(db, 'salarios'), { ...data, createdAt: serverTimestamp() });
      toast({ title: "Sucesso!", description: "Novo salário salvo." });
      reset();
    } catch (e) {
      toast({ title: "Erro!", description: "Não foi possível salvar o salário.", variant: "destructive" });
    }
  };

  const handleGerarPagamentos = async () => {
    if (!categoriaSalarioId) {
      toast({ title: "Erro", description: "A categoria 'Salários' é necessária para gerar os pagamentos.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    
    const now = getSaoPauloTime();
    const inicioMes = startOfMonth(now);
    const fimMes = endOfMonth(now);
    
    try {
      const movimentacoesMesQuery = query(
        collection(db, 'movimentacoes'),
        where('categoria', '==', categoriaSalarioId),
        where('data', '>=', inicioMes),
        where('data', '<=', fimMes)
      );
      
      const movimentacoesExistentes = await getDocs(movimentacoesMesQuery);
      const descricoesExistentes = new Set(movimentacoesExistentes.docs.map(d => d.data().descricao));

      const batch = writeBatch(db);
      let pagamentosGeradosCount = 0;

      salarios.forEach(salario => {
        const descricaoMovimentacao = `Pagamento Salário: ${salario.nomeFuncionario}`;
        if (!descricoesExistentes.has(descricaoMovimentacao)) {
          const daysInMonth = getDaysInMonth(now);
          const paymentDay = salario.diaPagamento > daysInMonth ? daysInMonth : salario.diaPagamento;
          const dataPagamento = set(now, { date: paymentDay, hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });
          const novoDocRef = doc(collection(db, 'movimentacoes'));
          batch.set(novoDocRef, {
            tipo: 'saida',
            descricao: descricaoMovimentacao,
            valor: salario.valor,
            data: dataPagamento,
            categoria: categoriaSalarioId,
            contaId: salario.contaDebitoId,
            createdAt: serverTimestamp()
          });
          pagamentosGeradosCount++;
        }
      });

      if (pagamentosGeradosCount > 0) {
        await batch.commit();
        toast({ title: "Sucesso!", description: `${pagamentosGeradosCount} pagamento(s) de salário foi(ram) gerado(s).` });
      } else {
        toast({ title: "Nenhuma Ação Necessária", description: "Todos os salários para este mês já foram pagos." });
      }
    } catch (e) {
      console.error("Erro ao gerar pagamentos: ", e);
      toast({ title: "Erro!", description: "Ocorreu um erro ao gerar os pagamentos.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestão de Salários</h1>
        <Button asChild variant="outline"><Link href="/">Voltar ao Dashboard</Link></Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Salário</CardTitle>
              <CardDescription>Cadastre os dados do funcionário e seu salário.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeFuncionario">Nome do Funcionário</Label>
                  <Input id="nomeFuncionario" {...register('nomeFuncionario')} placeholder="Ex: João da Silva" />
                  {errors.nomeFuncionario && <p className="text-sm text-red-500">{errors.nomeFuncionario.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input id="valor" type="number" step="0.01" {...register('valor', { valueAsNumber: true })} />
                  {errors.valor && <p className="text-sm text-red-500">{errors.valor.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Conta para Débito</Label>
                  <Controller name="contaDebitoId" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{contas.map(c=><SelectItem key={c.id} value={c.id!}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                   )}/>
                  {errors.contaDebitoId && <p className="text-sm text-red-500">{errors.contaDebitoId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diaPagamento">Dia do Pagamento</Label>
                  <Input id="diaPagamento" type="number" {...register('diaPagamento', { valueAsNumber: true })} />
                  {errors.diaPagamento && <p className="text-sm text-red-500">{errors.diaPagamento.message}</p>}
                </div>
                <Button type="submit" className="w-full">Salvar Salário</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Lista e Ação */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Salários Cadastrados</CardTitle>
                <CardDescription>Lista de todos os funcionários e seus respectivos salários.</CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isGenerating || !categoriaSalarioId} size="sm">{isGenerating ? "Gerando..." : "Gerar Pagamentos do Mês"}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Pagamentos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso criará as movimentações de saída para todos os salários que ainda não foram pagos neste mês. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleGerarPagamentos}>Confirmar e Gerar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center p-8">Carregando...</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Dia do Pagamento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salarios.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground h-24">Nenhum salário cadastrado.</TableCell>
                        </TableRow>
                      ) : (
                        salarios.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.nomeFuncionario}</TableCell>
                            <TableCell>Todo dia {s.diaPagamento}</TableCell>
                            <TableCell className="text-right font-semibold">{s.valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
