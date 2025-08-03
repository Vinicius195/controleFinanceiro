'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Models e Firebase
import { MovimentacaoSchema, Movimentacao } from '@/models/Movimentacao';
import { Categoria } from '@/models/Categoria';
import { ContaBancaria } from '@/models/ContaBancaria';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Componentes
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import MovimentacaoFormFields from './MovimentacaoFormFields';

interface EditarMovimentacaoProps {
  movimentacao: Movimentacao | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

type FormValues = Omit<Movimentacao, 'id'>;

export default function EditarMovimentacao({ movimentacao, isOpen, setIsOpen }: EditarMovimentacaoProps) {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]); // Estado para as contas

  const methods = useForm<FormValues>({
    resolver: zodResolver(MovimentacaoSchema.omit({ id: true })),
  });

  // Efeito para preencher o formulário
  useEffect(() => {
    if (movimentacao) {
      methods.reset({
        ...movimentacao,
        data: new Date(movimentacao.data),
      });
    }
  }, [movimentacao, methods]);

  // Efeito para buscar categorias e contas
  useEffect(() => {
    const qCategorias = query(collection(db, 'categorias'), orderBy('nome', 'asc'));
    const unsubCategorias = onSnapshot(qCategorias, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Categoria));
      setCategorias(items);
    });

    const qContas = query(collection(db, 'contasBancarias'), orderBy('nome', 'asc'));
    const unsubContas = onSnapshot(qContas, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContaBancaria));
      setContas(items);
    });

    return () => {
      unsubCategorias();
      unsubContas();
    };
  }, []);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!movimentacao?.id) return;

    try {
      const docRef = doc(db, "movimentacoes", movimentacao.id);
      await updateDoc(docRef, { ...data });
      toast({
        title: "Sucesso!",
        description: "A movimentação foi atualizada.",
      });
      setIsOpen(false);
    } catch (e) {
      console.error("Erro ao atualizar documento: ", e);
      toast({
        title: "Erro!",
        description: "Não foi possível atualizar a movimentação.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Movimentação</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias e clique em salvar.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {/* Passando ambas as listas para os campos */}
            <MovimentacaoFormFields categorias={categorias} contas={contas} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
