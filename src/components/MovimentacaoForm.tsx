'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Models e Firebase
import { MovimentacaoSchema, Movimentacao } from '@/models/Movimentacao';
import { Categoria } from '@/models/Categoria';
import { ContaBancaria } from '@/models/ContaBancaria'; // Importando ContaBancaria
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';

// Componentes
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MovimentacaoFormFields from './MovimentacaoFormFields';

type FormValues = Omit<Movimentacao, 'id'>;

export default function MovimentacaoForm() {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]); // Estado para as contas

  const methods = useForm<FormValues>({
    resolver: zodResolver(MovimentacaoSchema.omit({ id: true })),
    defaultValues: {
      tipo: 'entrada',
      data: new Date(),
      descricao: '',
      valor: 0,
      categoria: '',
      contaId: '', // Adicionando valor padrão
    },
  });

  // Efeito para buscar tanto categorias quanto contas
  useEffect(() => {
    // Busca Categorias
    const qCategorias = query(collection(db, 'categorias'), orderBy('nome', 'asc'));
    const unsubCategorias = onSnapshot(qCategorias, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Categoria));
      setCategorias(items);
    });

    // Busca Contas Bancárias
    const qContas = query(collection(db, 'contasBancarias'), orderBy('nome', 'asc'));
    const unsubContas = onSnapshot(qContas, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContaBancaria));
      setContas(items);
    });

    // Função de limpeza para parar de ouvir as atualizações
    return () => {
      unsubCategorias();
      unsubContas();
    };
  }, []);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await addDoc(collection(db, "movimentacoes"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Sucesso!",
        description: "Sua movimentação foi registrada.",
      });
      methods.reset();
    } catch (e) {
      console.error("Erro ao adicionar documento: ", e);
      toast({
        title: "Erro!",
        description: "Não foi possível registrar a movimentação.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Registrar Nova Movimentação</CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {/* Passando contas para o componente de campos */}
            <MovimentacaoFormFields categorias={categorias} contas={contas} />
            <Button type="submit" className="w-full">Adicionar Movimentação</Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
