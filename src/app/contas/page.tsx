'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { MoreHorizontal } from "lucide-react"

// Modelos e Config do Firebase
import { ContaBancaria, ContaBancariaSchema } from '@/models/ContaBancaria';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, doc, writeBatch, where, getDocs } from 'firebase/firestore';

// Componentes Shadcn/UI
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

type FormValues = Omit<ContaBancaria, 'id'>;

export default function ContasBancariasPage() {
  const { toast } = useToast();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [contaParaExcluir, setContaParaExcluir] = useState<ContaBancaria | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ContaBancariaSchema.omit({ id: true })),
    defaultValues: { nome: '', banco: '', saldoInicial: 0 }
  });

  useEffect(() => {
    const q = query(collection(db, 'contasBancarias'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setContas(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContaBancaria)));
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar contas: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await addDoc(collection(db, 'contasBancarias'), {
        ...data,
        saldoInicial: Number(data.saldoInicial),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Sucesso!", description: `A conta "${data.nome}" foi criada.` });
      reset();
    } catch (e) {
      toast({ title: "Erro!", description: "Não foi possível criar a conta.", variant: "destructive" });
    }
  };

  const openDeleteDialog = (conta: ContaBancaria) => {
    setContaParaExcluir(conta);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setContaParaExcluir(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!contaParaExcluir || !contaParaExcluir.id) return;
    
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      const movQuery = query(collection(db, "movimentacoes"), where("contaId", "==", contaParaExcluir.id));
      const movSnapshot = await getDocs(movQuery);
      movSnapshot.forEach(doc => batch.delete(doc.ref));
      
      const salQuery = query(collection(db, "salarios"), where("contaDebitoId", "==", contaParaExcluir.id));
      const salSnapshot = await getDocs(salQuery);
      salSnapshot.forEach(doc => batch.delete(doc.ref));

      const contaRef = doc(db, 'contasBancarias', contaParaExcluir.id);
      batch.delete(contaRef);

      await batch.commit();
      toast({ title: "Sucesso!", description: `A conta "${contaParaExcluir.nome}" foi excluída.` });
      
    } catch (e) {
      toast({ title: "Erro!", description: "Não foi possível excluir a conta.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      handleDialogClose();
    }
  };

  return (
    <>
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Contas Bancárias</h1>
          <Button asChild><Link href="/">Voltar ao Dashboard</Link></Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader><CardTitle>Adicionar Nova Conta</CardTitle></CardHeader>
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

          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Contas Cadastradas</CardTitle></CardHeader>
              <CardContent>
                {loading ? <p>Carregando...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Banco</TableHead>
                        <TableHead className="text-right">Saldo Inicial</TableHead>
                        <TableHead className="text-right w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contas.map((conta) => (
                        <TableRow key={conta.id}>
                          <TableCell className="font-medium">{conta.nome}</TableCell>
                          <TableCell>{conta.banco || 'N/A'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(conta.saldoInicial)}</TableCell>
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
                                  <DropdownMenuItem onClick={() => openDeleteDialog(conta)} className="text-red-600">
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Atenção: Excluir a conta <span className="font-bold">"{contaParaExcluir?.nome}"</span> é uma ação irreversível. Todos os dados associados (movimentações, salários) serão <span className="font-bold text-red-600">permanentemente excluídos</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogClose}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir Tudo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
