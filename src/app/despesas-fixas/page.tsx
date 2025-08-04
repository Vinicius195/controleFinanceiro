'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { startOfMonth, endOfMonth, set } from 'date-fns';

// Models
import { DespesaFixa, DespesaFixaSchema } from '@/models/DespesaFixa';
import { Categoria } from '@/models/Categoria';
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

type FormValues = Omit<DespesaFixa, 'id'>;

export default function DespesasFixasPage() {
  const { toast } = useToast();
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Formulário para adicionar nova despesa
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(DespesaFixaSchema.omit({ id: true })),
    defaultValues: { descricao: '', valor: 0, diaVencimento: 1, categoria: '', contaPadraoId: '' }
  });

  // Efeito para buscar todos os dados necessários
  useEffect(() => {
    setLoading(true);
    const qDespesas = query(collection(db, 'despesasFixas'), orderBy('diaVencimento', 'asc'));
    const unsubDespesas = onSnapshot(qDespesas, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DespesaFixa));
      setDespesasFixas(items);
      setLoading(false);
    });
    
    const qCategorias = query(collection(db, 'categorias'), orderBy('nome', 'asc'));
    const unsubCategorias = onSnapshot(qCategorias, (s) => setCategorias(s.docs.map(d => ({ id: d.id, ...d.data() } as Categoria))));
    
    const qContas = query(collection(db, 'contasBancarias'), orderBy('nome', 'asc'));
    const unsubContas = onSnapshot(qContas, (s) => setContas(s.docs.map(d => ({ id: d.id, ...d.data() } as ContaBancaria))));

    return () => { unsubDespesas(); unsubCategorias(); unsubContas(); };
  }, []);

  // Handler para adicionar nova despesa fixa
  const onFormSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await addDoc(collection(db, 'despesasFixas'), { ...data, createdAt: serverTimestamp() });
      toast({ title: "Sucesso!", description: "Nova despesa fixa salva." });
      reset();
    } catch (e) {
      toast({ title: "Erro!", description: "Não foi possível salvar a despesa.", variant: "destructive" });
    }
  };

  // Handler para gerar as transações do mês
  const handleGerarDespesas = async () => {
    setIsGenerating(true);
    
    const now = new Date();
    const inicioMes = startOfMonth(now);
    const fimMes = endOfMonth(now);
    
    try {
        const movimentacoesMesQuery = query(
            collection(db, 'movimentacoes'),
            where('data', '>=', inicioMes),
            where('data', '<=', fimMes)
        );
        
        const movimentacoesExistentes = await getDocs(movimentacoesMesQuery);
        // Criar um Set de descrições para verificar se a despesa já foi lançada
        const descricoesExistentes = new Set(movimentacoesExistentes.docs.map(d => d.data().descricao));

        const batch = writeBatch(db);
        let despesasGeradasCount = 0;

        despesasFixas.forEach(despesa => {
            const descricaoMovimentacao = `Pagamento Fixo: ${despesa.descricao}`;
            // Apenas gera se uma movimentação com essa descrição exata não existir no mês
            if (!descricoesExistentes.has(descricaoMovimentacao)) {
                const dataVencimento = set(now, { date: despesa.diaVencimento, hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });
                const novoDocRef = doc(collection(db, 'movimentacoes'));
                batch.set(novoDocRef, {
                    tipo: 'saida',
                    descricao: descricaoMovimentacao,
                    valor: despesa.valor,
                    data: dataVencimento,
                    categoria: despesa.categoria, // AGORA USA O ID DA CATEGORIA SALVO
                    contaId: despesa.contaPadraoId,
                    createdAt: serverTimestamp()
                });
                despesasGeradasCount++;
            }
        });

        if (despesasGeradasCount > 0) {
            await batch.commit();
            toast({ title: "Sucesso!", description: `${despesasGeradasCount} despesa(s) foi(ram) gerada(s) como movimentação de saída.` });
        } else {
            toast({ title: "Nenhuma Ação Necessária", description: "Todas as despesas fixas para este mês já foram geradas." });
        }
    } catch (e) {
        console.error("Erro ao gerar despesas: ", e);
        toast({ title: "Erro!", description: "Ocorreu um erro ao gerar as despesas.", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestão de Despesas Fixas</h1>
        <Button asChild variant="outline"><Link href="/">Voltar ao Dashboard</Link></Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Despesa Fixa</CardTitle>
              <CardDescription>Preencha os dados para criar uma nova despesa recorrente.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input id="descricao" {...register('descricao')} placeholder="Ex: Aluguel, Salário Zé" />
                  {errors.descricao && <p className="text-sm text-red-500">{errors.descricao.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input id="valor" type="number" step="0.01" {...register('valor', { valueAsNumber: true })} />
                  {errors.valor && <p className="text-sm text-red-500">{errors.valor.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Categoria Padrão</Label>
                   <Controller name="categoria" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{categorias.map(c=><SelectItem key={c.id} value={c.id!}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                   )}/>
                  {errors.categoria && <p className="text-sm text-red-500">{errors.categoria.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Conta Padrão (Saída)</Label>
                  <Controller name="contaPadraoId" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{contas.map(c=><SelectItem key={c.id} value={c.id!}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                   )}/>
                  {errors.contaPadraoId && <p className="text-sm text-red-500">{errors.contaPadraoId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diaVencimento">Dia do Vencimento</Label>
                  <Input id="diaVencimento" type="number" {...register('diaVencimento', { valueAsNumber: true })} />
                  {errors.diaVencimento && <p className="text-sm text-red-500">{errors.diaVencimento.message}</p>}
                </div>
                <Button type="submit" className="w-full">Salvar Despesa</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Lista e Ação */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Despesas Cadastradas</CardTitle>
                <CardDescription>Abaixo estão todas as suas despesas recorrentes.</CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isGenerating} size="sm">{isGenerating ? "Gerando..." : "Gerar Despesas do Mês"}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Geração?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso criará múltiplas movimentações de saída, uma para cada despesa fixa que ainda não foi paga neste mês. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleGerarDespesas}>Confirmar e Gerar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-muted-foreground">Carregando despesas...</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {despesasFixas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground h-24">Nenhuma despesa fixa cadastrada.</TableCell>
                        </TableRow>
                      ) : (
                        despesasFixas.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.descricao}</TableCell>
                            <TableCell>Todo dia {d.diaVencimento}</TableCell>
                            <TableCell className="text-right font-semibold">{d.valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</TableCell>
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
