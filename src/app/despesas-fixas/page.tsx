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
    defaultValues: { descricao: '', valor: 0, diaVencimento: 1 }
  });

  // Efeito para buscar todos os dados necessários
  useEffect(() => {
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
            where('categoria', '==', 'Despesa Fixa'),
            where('data', '>=', inicioMes),
            where('data', '<=', fimMes)
        );
        const movimentacoesExistentes = await getDocs(movimentacoesMesQuery);
        const descricoesExistentes = new Set(movimentacoesExistentes.docs.map(d => d.data().descricao));

        const batch = writeBatch(db);
        let despesasGeradasCount = 0;

        despesasFixas.forEach(despesa => {
            const descricaoMovimentacao = `Pagamento: ${despesa.descricao}`;
            if (!descricoesExistentes.has(descricaoMovimentacao)) {
                const dataVencimento = set(now, { date: despesa.diaVencimento });
                const novoDocRef = doc(collection(db, 'movimentacoes'));
                batch.set(novoDocRef, {
                    tipo: 'saida',
                    descricao: descricaoMovimentacao,
                    valor: despesa.valor,
                    data: dataVencimento,
                    categoria: 'Despesa Fixa',
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
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Despesas Fixas</h1>
        <Button asChild><Link href="/">Voltar ao Dashboard</Link></Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Adicionar Despesa Fixa</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                {/* Campos do Formulário */}
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input {...register('descricao')} placeholder="Ex: Aluguel, Salário Zé" />
                  {errors.descricao && <p className="text-sm text-red-500">{errors.descricao.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" {...register('valor', { valueAsNumber: true })} />
                  {errors.valor && <p className="text-sm text-red-500">{errors.valor.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Categoria Padrão</Label>
                   <Controller name="categoria" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{categorias.map(c=><SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                   )}/>
                  {errors.categoria && <p className="text-sm text-red-500">{errors.categoria.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Conta Padrão (Saída)</Label>
                  <Controller name="contaPadraoId" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{contas.map(c=><SelectItem key={c.id} value={c.id!}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                   )}/>
                  {errors.contaPadraoId && <p className="text-sm text-red-500">{errors.contaPadraoId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Dia do Vencimento</Label>
                  <Input type="number" {...register('diaVencimento', { valueAsNumber: true })} />
                  {errors.diaVencimento && <p className="text-sm text-red-500">{errors.diaVencimento.message}</p>}
                </div>
                <Button type="submit" className="w-full">Salvar Despesa</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Lista e Ação */}
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Gerador Mensal</CardTitle>
                    <CardDescription>Clique no botão para gerar as transações de saída para todas as despesas fixas cadastradas. O sistema não criará duplicatas se já tiverem sido geradas neste mês.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full" disabled={isGenerating}>{isGenerating ? "Gerando..." : "Gerar Despesas do Mês Atual"}</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirmar Geração?</AlertDialogTitle><AlertDialogDescription>Isso criará múltiplas movimentações de saída, uma para cada despesa fixa. Deseja continuar?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleGerarDespesas}>Confirmar e Gerar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Despesas Cadastradas</CardTitle></CardHeader>
                <CardContent>
                    {loading ? <p>Carregando...</p> : (
                        <Table><TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {despesasFixas.map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell>{d.descricao}</TableCell>
                                    <TableCell>Todo dia {d.diaVencimento}</TableCell>
                                    <TableCell className="text-right font-bold">{d.valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
