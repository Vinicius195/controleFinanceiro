'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ContaBancaria } from '@/models/ContaBancaria';

// Componentes
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface FiltroContaProps {
  onAccountChange: (accountId: string | null) => void;
}

export default function FiltroConta({ onAccountChange }: FiltroContaProps) {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'contasBancarias'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContaBancaria));
      setContas(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (value: string) => {
    // Se o valor for "all", passamos null para indicar que não há filtro
    onAccountChange(value === 'all' ? null : value);
  };

  return (
    <div className="w-full max-w-xs">
      <Label>Filtrar por Conta</Label>
      <Select onValueChange={handleChange} defaultValue="all" disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma conta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Contas</SelectItem>
          {contas.map(conta => (
            <SelectItem key={conta.id} value={conta.id!}>
              {conta.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
