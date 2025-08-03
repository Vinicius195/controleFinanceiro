'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Models e Firebase
import { MovimentacaoSchema, Movimentacao } from '@/models/Movimentacao';
import { Categoria } from '@/models/Categoria';
import { ContaBancaria } from '@/models/ContaBancaria';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';

// Componentes
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MovimentacaoFormFields from './MovimentacaoFormFields';

type FormValues = Omit<Movimentacao, 'id'>;

interface MovimentacaoFormProps {
  onSave?: () => void; // A prop onSave é opcional
}

export default function MovimentacaoForm({ onSave }: MovimentacaoFormProps) {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(MovimentacaoSchema.omit({ id: true })),
    defaultValues: {
      tipo: 'entrada',
      data: new Date(),
      descricao: '',
      valor: 0,
      categoria: '',
      contaId: '',
    },
  });

  useEffect(() => {
    const qCategorias = query(collection(db, 'categorias'), orderBy('nome', 'asc'));
    const unsubCategorias = onSnapshot(qCategorias, (snapshot) => {
      setCategorias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Categoria)));
    });

    const qContas = query(collection(db, 'contasBancarias'), orderBy('nome', 'asc'));
    const unsubContas = onSnapshot(qContas, (snapshot) => {
      setContas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContaBancaria)));
    });

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
      
      // Chama a função onSave se ela foi fornecida
      if (onSave) {
        onSave();
      }

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
    // Não precisamos mais do Card aqui, pois o Dialog já provê a estrutura
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <MovimentacaoFormFields categorias={categorias} contas={contas} />
        <Button type="submit" className="w-full">Salvar Movimentação</Button>
      </form>
    </FormProvider>
  );
}
