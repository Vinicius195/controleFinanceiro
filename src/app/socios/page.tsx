'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

// Modelos e Config do Firebase
import { Socio, SocioSchema } from '@/models/Socio';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';

// Componentes
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import RelatorioLucros from '@/components/RelatorioLucros'; // Importando o novo componente

type FormValues = Omit<Socio, 'id'>;

export default function SociosPage() {
  const { toast } = useToast();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPercentual, setTotalPercentual] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(SocioSchema.omit({ id: true })),
    defaultValues: { nome: '', percentualLucro: 0 }
  });

  useEffect(() => {
    const q = query(collection(db, 'socios'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let percentualAcumulado = 0;
      const items: Socio[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Socio;
        items.push({ id: doc.id, ...data });
        percentualAcumulado += data.percentualLucro;
      });
      setSocios(items);
      setTotalPercentual(percentualAcumulado);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // ... (lógica de submit inalterada)
  };

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciar Sócios e Divisão de Lucros</h1>
        <Button asChild>
          <Link href="/">Voltar ao Dashboard</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Adição */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Sócio</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Sócio</Label>
                  <Input id="nome" {...register('nome')} />
                  {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentualLucro">Percentual do Lucro (%)</Label>
                  <Input id="percentualLucro" type="number" step="0.1" {...register('percentualLucro', { valueAsNumber: true })} />
                  {errors.percentualLucro && <p className="text-sm text-red-500">{errors.percentualLucro.message}</p>}
                </div>
                <Button type="submit" className="w-full">Salvar Sócio</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Lista e Resumo */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Divisão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={totalPercentual} className="w-full" />
                <span className="font-bold text-lg">{totalPercentual}%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sócios Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p>Carregando...</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">Participação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {socios.map((socio) => (
                      <TableRow key={socio.id}>
                        <TableCell className="font-medium">{socio.nome}</TableCell>
                        <TableCell className="text-right font-bold">{socio.percentualLucro}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção do Relatório de Lucros */}
      <RelatorioLucros socios={socios} />

    </main>
  );
}
