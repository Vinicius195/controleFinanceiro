'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Categoria } from '@/models/Categoria';
import { ContaBancaria } from '@/models/ContaBancaria';
import { getSaoPauloTime } from '@/lib/date-utils';

// Shadcn UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MovimentacaoFormFieldsProps {
  categorias: Categoria[];
  contas: ContaBancaria[];
}

export default function MovimentacaoFormFields({ categorias, contas }: MovimentacaoFormFieldsProps) {
  const { register, control, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-4">
      {/* Campo de Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Input id="descricao" {...register("descricao")} />
        {errors.descricao && <p className="text-sm text-red-500">{(errors.descricao as any).message}</p>}
      </div>

      {/* Campo de Valor */}
      <div className="space-y-2">
        <Label htmlFor="valor">Valor (R$)</Label>
        <Input id="valor" type="number" step="0.01" {...register("valor", { valueAsNumber: true })} />
        {errors.valor && <p className="text-sm text-red-500">{(errors.valor as any).message}</p>}
      </div>
      
      {/* Campo de Tipo */}
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Controller name="tipo" control={control} render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4">
              <RadioGroupItem value="entrada" id="r-entrada-fields" />
              <Label htmlFor="r-entrada-fields">Entrada</Label>
              <RadioGroupItem value="saida" id="r-saida-fields" />
              <Label htmlFor="r-saida-fields">Saída</Label>
            </RadioGroup>
        )}/>
      </div>

      {/* Seletor de Conta Bancária */}
      <div className="space-y-2">
        <Label htmlFor="contaId">Conta Bancária</Label>
        <Controller name="contaId" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {contas.map(conta => (
                  <SelectItem key={conta.id} value={conta.id!}>{conta.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        )}/>
        {errors.contaId && <p className="text-sm text-red-500">{(errors.contaId as any).message}</p>}
      </div>

      {/* Campo de Categoria */}
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria</Label>
        <Controller name="categoria" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(cat => (
                  <SelectItem key={cat.id} value={cat.id!}>{cat.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        )}/>
        {errors.categoria && <p className="text-sm text-red-500">{(errors.categoria as any).message}</p>}
      </div>

      {/* Campo de Data */}
      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
         <Controller name="data" control={control} render={({ field }) => (
            <Input type="date" value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} onChange={(e) => field.onChange(e.target.valueAsDate ? getSaoPauloTime(e.target.valueAsDate) : null)}/>
         )}/>
        {errors.data && <p className="text-sm text-red-500">{(errors.data as any).message}</p>}
      </div>
    </div>
  );
}
