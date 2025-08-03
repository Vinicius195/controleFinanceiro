'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

// Modelos e Config do Firebase
import { Categoria, CategoriaSchema } from '@/models/Categoria';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';

// Componentes Shadcn/UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FormValues = Omit<Categoria, 'id'>;

export default function CategoriasPage() {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // React Hook Form para o formulário de nova categoria
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CategoriaSchema.omit({ id: true })),
  });

  // Efeito para buscar as categorias em tempo real
  useEffect(() => {
    const q = query(collection(db, 'categorias'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: Categoria[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Categoria);
      });
      setCategorias(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Função para lidar com o envio do formulário
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await addDoc(collection(db, 'categorias'), {
        nome: data.nome,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Sucesso!",
        description: `A categoria "${data.nome}" foi criada.`,
      });
      reset({ nome: '' });
    } catch (e) {
      console.error("Erro ao adicionar categoria: ", e);
      toast({
        title: "Erro!",
        description: "Não foi possível criar a categoria.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Categorias</h1>
        <Button asChild>
          <Link href="/">Voltar ao Dashboard</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Adição */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Categoria</Label>
                  <Input id="nome" {...register('nome')} />
                  {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
                </div>
                <Button type="submit" className="w-full">Salvar Categoria</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Categorias */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Categorias Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      {/* Espaço para futuras ações como editar/excluir */}
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorias.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.nome}</TableCell>
                        <TableCell className="text-right">
                          {/* Botões de ação virão aqui */}
                        </TableCell>
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
