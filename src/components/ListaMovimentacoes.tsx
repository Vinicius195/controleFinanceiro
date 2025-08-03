'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, where, doc, deleteDoc, QueryConstraint } from 'firebase/firestore';
import { Movimentacao } from '@/models/Movimentacao';
import { MoreHorizontal } from "lucide-react";

// Componentes
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import EditarMovimentacao from './EditarMovimentacao';

interface ListaMovimentacoesProps {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  contaId: string | null;
}

export default function ListaMovimentacoes({ periodo, contaId }: ListaMovimentacoesProps) {
  const { toast } = useToast();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [contasMap, setContasMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  
  const [itemParaExcluir, setItemParaExcluir] = useState<string | null>(null);
  const [itemParaEditar, setItemParaEditar] = useState<Movimentacao | null>(null);
  const [isModalEdicaoAberto, setIsModalEdicaoAberto] = useState(false);

  useEffect(() => {
    setLoading(true);

    const qContas = query(collection(db, 'contasBancarias'));
    const unsubContas = onSnapshot(qContas, (snapshot) => {
      const newContasMap = new Map<string, string>();
      snapshot.forEach(doc => newContasMap.set(doc.id, doc.data().nome));
      setContasMap(newContasMap);
    });

    if (!periodo.inicio || !periodo.fim) {
        setLoading(false);
        return;
    };

    let queryConstraints: QueryConstraint[] = [
        where('createdAt', '>=', periodo.inicio),
        where('createdAt', '<=', periodo.fim),
        orderBy('createdAt', 'desc')
    ];

    if (contaId) {
        queryConstraints.push(where('contaId', '==', contaId));
    }

    const qMovimentacoes = query(collection(db, 'movimentacoes'), ...queryConstraints);
    const unsubMovimentacoes = onSnapshot(qMovimentacoes, (querySnapshot) => {
      const items: Movimentacao[] = querySnapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(), data: doc.data().data.toDate()
      }) as Movimentacao);
      setMovimentacoes(items);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar movimentações: ", error); setLoading(false);
    });

    return () => {
      unsubContas();
      unsubMovimentacoes();
    };
  }, [periodo, contaId]);

  const handleExcluirConfirm = async (id: string) => {
    await deleteDoc(doc(db, "movimentacoes", id));
    toast({ title: "Sucesso!", description: "Movimentação excluída." });
    setItemParaExcluir(null);
  };
  
  const handleAbrirModalEdicao = (mov: Movimentacao) => {
    setItemParaEditar(mov);
    setIsModalEdicaoAberto(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader><CardTitle>Movimentações no Período</CardTitle></CardHeader>
        <CardContent>
          {loading ? (<p>Carregando...</p>) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="font-medium">{mov.descricao}</TableCell>
                    <TableCell>{contasMap.get(mov.contaId) || 'N/D'}</TableCell>
                    <TableCell>{mov.categoria}</TableCell>
                    <TableCell>{new Date(mov.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className={`text-right font-bold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.tipo === 'saida' && '- '}
                      {mov.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleAbrirModalEdicao(mov)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onSelect={() => setItemParaExcluir(mov.id!)}>Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                {movimentacoes.length === 0 ? "Nenhuma movimentação registrada neste período." : "Lista de suas últimas movimentações financeiras."}
              </TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
      {itemParaEditar && <EditarMovimentacao isOpen={isModalEdicaoAberto} setIsOpen={setIsModalEdicaoAberto} movimentacao={itemParaEditar} />}
      <AlertDialog open={!!itemParaExcluir} onOpenChange={() => setItemParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleExcluirConfirm(itemParaExcluir!)}>Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
