'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

// Modelos e Config do Firebase
import { ContaBancaria, ContaBancariaSchema } from '@/models/ContaBancaria';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';

// Componentes Shadcn/UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FormValues = Omit<ContaBancaria, 'id'>;

export default function ContasBancariasPage() {
  const { toast } = useToast();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ContaBancariaSchema.omit({ id: true })),
    defaultValues: {
      nome: '',
      banco: '',
      saldoInicial: 0,
    }
  });

  // Efeito para buscar as contas em tempo real
  useEffect(() => {
    const q = query(collection(db, 'contasBancarias'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: ContaBancaria[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ContaBancaria);
      });
      setContas(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await addDoc(collection(db, 'contasBancarias'), {
        ...data,
        saldoInicial: Number(data.saldoInicial),
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Sucesso!",
        description: `A conta "${data.nome}" foi criada.`,
      });
      reset();
    } catch (e) {
      console.error("Erro ao adicionar conta: ", e);
      toast({
        title: "Erro!",
        description: "Não foi possível criar a conta.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Contas Bancárias</h1>
        <Button asChild>
          <Link href="/">Voltar ao Dashboard</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Adição */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Conta</CardTitle>
            </CardHeader>
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

        {/* Lista de Contas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contas Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p>Carregando...</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead className="text-right">Saldo Inicial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contas.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium">{conta.nome}</TableCell>
                        <TableCell>{conta.banco || 'N/A'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(conta.saldoInicial)}</TableCell>
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
