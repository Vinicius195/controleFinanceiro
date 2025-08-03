'use client';

import React, { useState, useEffect } from 'react';
import { subDays } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Socio } from '@/models/Socio';

// Componentes
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FiltroPeriodo from './FiltroPeriodo';
import { Button } from './ui/button';
import RegistrarRetirada from './RegistrarRetirada'; // Importando o modal de retirada

interface RelatorioLucrosProps {
  socios: Socio[];
}

export default function RelatorioLucros({ socios }: RelatorioLucrosProps) {
  const [periodo, setPeriodo] = useState({
    inicio: subDays(new Date(), 30),
    fim: new Date(),
  });
  const [lucro, setLucro] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar o modal

  // Efeito para recalcular o lucro
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'movimentacoes'),
      where('createdAt', '>=', periodo.inicio),
      where('createdAt', '<=', periodo.fim)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let entradas = 0;
      let saidas = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.tipo === 'entrada') entradas += data.valor;
        else saidas += data.valor;
      });
      setLucro(entradas - saidas);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [periodo]);
  
  const handleFilterChange = (inicio: Date, fim: Date) => {
    const adjustedFim = new Date(fim);
    adjustedFim.setHours(23, 59, 59, 999);
    setPeriodo({ inicio, fim: adjustedFim });
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Relatório de Divisão de Lucros</CardTitle>
          <CardDescription>
            Calcule o lucro para um período específico e veja a divisão entre os sócios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FiltroPeriodo onFilterChange={handleFilterChange} />

          {loading ? <p>Calculando...</p> : (
            <div>
              <div className="p-4 bg-gray-100 rounded-lg text-center mb-6">
                <p className="text-sm text-gray-600">Lucro Total no Período</p>
                <p className={`text-3xl font-bold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(lucro)}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sócio</TableHead>
                    <TableHead>Participação</TableHead>
                    <TableHead className="text-right">Valor a Receber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {socios.map(socio => {
                    const valorReceber = lucro > 0 ? (lucro * (socio.percentualLucro / 100)) : 0;
                    return (
                      <TableRow key={socio.id}>
                        <TableCell className="font-medium">{socio.nome}</TableCell>
                        <TableCell>{socio.percentualLucro}%</TableCell>
                        <TableCell className="text-right font-bold text-green-700">
                          {formatCurrency(valorReceber)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsModalOpen(true)} disabled={lucro <= 0}>
                  Registrar Retirada do Lucro
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renderizando o Modal */}
      <RegistrarRetirada
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        socios={socios}
        lucroPeriodo={lucro}
        periodo={periodo}
      />
    </>
  );
}
