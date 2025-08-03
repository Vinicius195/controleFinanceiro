'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { subDays } from 'date-fns';

interface FiltroPeriodoProps {
  onFilterChange: (startDate: Date, endDate: Date) => void;
}

export default function FiltroPeriodo({ onFilterChange }: FiltroPeriodoProps) {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const handleFilter = () => {
    onFilterChange(startDate, endDate);
  };

  const setPresetPeriod = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(start);
    setEndDate(end);
    onFilterChange(start, end);
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mb-8">
      <CardContent className="pt-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[150px]">
          <Label htmlFor="start-date">Data Início</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate.toISOString().split('T')[0]}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <Label htmlFor="end-date">Data Fim</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate.toISOString().split('T')[0]}
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </div>
        <Button onClick={handleFilter}>Filtrar</Button>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPresetPeriod(7)}>Últimos 7 dias</Button>
            <Button variant="outline" onClick={() => setPresetPeriod(30)}>Últimos 30 dias</Button>
        </div>
      </CardContent>
    </Card>
  );
}
