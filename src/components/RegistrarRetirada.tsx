'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, writeBatch, serverTimestamp, doc } from 'firebase/firestore'; // Importando 'doc'
import { Socio } from '@/models/Socio';
import { ContaBancaria } from '@/models/ContaBancaria';
import { getSaoPauloTime } from '@/lib/date-utils';

// Componentes
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface RegistrarRetiradaProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  socios: Socio[];
  lucroPeriodo: number;
  periodo: { inicio: Date, fim: Date };
}

export default function RegistrarRetirada({ isOpen, setIsOpen, socios, lucroPeriodo, periodo }: RegistrarRetiradaProps) {
  const { toast } = useToast();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contaSelecionadaId, setContaSelecionadaId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Busca as contas bancárias
  useEffect(() => {
    const q = query(collection(db, 'contasBancarias'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContaBancaria));
      setContas(items);
    });
    return () => unsubscribe();
  }, []);

  const handleConfirmarRetirada = async () => {
    if (!contaSelecionadaId) {
      toast({ title: "Erro", description: "Por favor, selecione uma conta bancária.", variant: "destructive" });
      return;
    }
    if (lucroPeriodo <= 0) {
        toast({ title: "Atenção", description: "Não há lucro para ser retirado.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);
      const dataRetirada = getSaoPauloTime();
      const periodoFormatado = `${format(periodo.inicio, 'dd/MM/yy')} - ${format(periodo.fim, 'dd/MM/yy')}`;

      socios.forEach(socio => {
        const valorRetirada = lucroPeriodo * (socio.percentualLucro / 100);
        if(valorRetirada > 0) {
            // Correção: Gerar uma referência de documento vazia dentro da coleção
            const novoDocRef = doc(collection(db, 'movimentacoes'));
            batch.set(novoDocRef, {
                tipo: 'saida',
                descricao: `Retirada de Lucro Sócio: ${socio.nome} (${periodoFormatado})`,
                valor: valorRetirada,
                data: dataRetirada,
                categoria: 'Retirada de Lucro',
                contaId: contaSelecionadaId,
                createdAt: serverTimestamp()
            });
        }
      });
      
      await batch.commit();

      toast({ title: "Sucesso!", description: "As retiradas de lucro foram registradas como movimentações de saída." });
      setIsOpen(false);

    } catch (e) {
      console.error("Erro ao registrar retiradas: ", e);
      toast({ title: "Erro!", description: "Ocorreu um erro ao registrar as retiradas.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Retirada de Lucro</DialogTitle>
          <DialogDescription>
            Confirme os detalhes para registrar a retirada do lucro como uma despesa. Essa ação criará múltiplas transações de saída.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <p className="text-lg text-center">Lucro Total a ser retirado: <strong className="text-green-600">{lucroPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
            <div className="space-y-2">
                <Label htmlFor="conta-retirada">De qual conta o dinheiro vai sair?</Label>
                <Select onValueChange={setContaSelecionadaId}>
                    <SelectTrigger id="conta-retirada">
                        <SelectValue placeholder="Selecione a conta de origem" />
                    </SelectTrigger>
                    <SelectContent>
                        {contas.map(conta => (
                            <SelectItem key={conta.id} value={conta.id!}>{conta.nome}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleConfirmarRetirada} disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Confirmar Retirada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
