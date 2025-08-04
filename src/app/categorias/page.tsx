'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { MoreHorizontal } from "lucide-react";

// Modelos e Config do Firebase
import { Categoria, CategoriaSchema } from '@/models/Categoria';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  writeBatch,
  where,
  getDocs
} from 'firebase/firestore';

// Componentes Shadcn/UI
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
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

type FormValues = Omit<Categoria, 'id'>;

export default function CategoriasPage() {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<Categoria | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CategoriaSchema.omit({ id: true })),
    defaultValues: { nome: '' }
  });

  useEffect(() => {
    const q = query(collection(db, 'categorias'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setCategorias(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Categoria)));
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar categorias: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await addDoc(collection(db, 'categorias'), { ...data, createdAt: serverTimestamp() });
      toast({ title: "Sucesso!", description: `A categoria "${data.nome}" foi criada.` });
      reset();
    } catch (e) {
      toast({ title: "Erro!", description: "Não foi possível criar a categoria.", variant: "destructive" });
    }
  };

  const openDeleteDialog = (categoria: Categoria) => {
    setCategoriaParaExcluir(categoria);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setCategoriaParaExcluir(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!categoriaParaExcluir || !categoriaParaExcluir.id) return;
    
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      const movQuery = query(collection(db, "movimentacoes"), where("categoria", "==", categoriaParaExcluir.id));
      const movSnapshot = await getDocs(movQuery);
      
      movSnapshot.forEach(doc => {
        batch.update(doc.ref, { categoria: "" }); 
      });
      
      const categoriaRef = doc(db, 'categorias', categoriaParaExcluir.id);
      batch.delete(categoriaRef);

      await batch.commit();
      toast({ title: "Sucesso!", description: `A categoria "${categoriaParaExcluir.nome}" foi excluída.` });
      
    } catch (e) {
      toast({ title: "Erro!", description: "Não foi possível excluir a categoria.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      handleDialogClose();
    }
  };

  return (
    <>
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Categorias</h1>
          <Button asChild><Link href="/">Voltar ao Dashboard</Link></Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader><CardTitle>Adicionar Nova Categoria</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Categoria</Label>
                    <Input id="nome" {...register('nome')} placeholder="Ex: Fornecedores, Impostos"/>
                    {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
                  </div>
                  <Button type="submit" className="w-full">Salvar Categoria</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Categorias Existentes</CardTitle></CardHeader>
              <CardContent>
                {loading ? (<p>Carregando...</p>) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorias.length === 0 ? (
                        <TableRow><TableCell colSpan={2} className="text-center h-24">Nenhuma categoria cadastrada.</TableCell></TableRow>
                      ) : (
                        categorias.map((cat) => (
                          <TableRow key={cat.id}>
                            <TableCell className="font-medium">{cat.nome}</TableCell>
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
                                  <DropdownMenuItem onClick={() => openDeleteDialog(cat)} className="text-red-600">
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
              Atenção: Excluir a categoria <span className="font-bold">"{categoriaParaExcluir?.nome}"</span> não irá apagar as movimentações financeiras associadas. Elas ficarão <span className="font-bold">sem categoria</span>. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogClose}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
