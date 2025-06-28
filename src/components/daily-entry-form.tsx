'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon, Save } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFinancialData } from "@/contexts/FinancialDataContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ptBR } from "date-fns/locale";

const FormSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  dineInRevenue: z.coerce.number().min(0, "O valor deve ser positivo"),
  deliveryRevenue: z.coerce.number().min(0, "O valor deve ser positivo"),
  takeoutRevenue: z.coerce.number().min(0, "O valor deve ser positivo"),
  ingredientCosts: z.coerce.number().min(0, "O valor deve ser positivo"),
  wageCosts: z.coerce.number().min(0, "O valor deve ser positivo"),
  rentCosts: z.coerce.number().min(0, "O valor deve ser positivo"),
  otherCosts: z.coerce.number().min(0, "O valor deve ser positivo"),
});

type FormValues = z.infer<typeof FormSchema>;

export function DailyEntryForm() {
    const { addOrUpdateEntry, getEntryByDate } = useFinancialData();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            date: selectedDate,
            dineInRevenue: 0,
            deliveryRevenue: 0,
            takeoutRevenue: 0,
            ingredientCosts: 0,
            wageCosts: 0,
            rentCosts: 0,
            otherCosts: 0,
        },
    });
    
    useEffect(() => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const entry = getEntryByDate(dateStr);
        // Using parse to avoid timezone issues
        const entryDate = entry ? parse(entry.date, 'yyyy-MM-dd', new Date()) : selectedDate;

        form.reset({
            date: entryDate,
            dineInRevenue: entry?.dineInRevenue ?? 0,
            deliveryRevenue: entry?.deliveryRevenue ?? 0,
            takeoutRevenue: entry?.takeoutRevenue ?? 0,
            ingredientCosts: entry?.ingredientCosts ?? 0,
            wageCosts: entry?.wageCosts ?? 0,
            rentCosts: entry?.rentCosts ?? 0,
            otherCosts: entry?.otherCosts ?? 0,
        });
    }, [selectedDate, getEntryByDate, form]);

    function onSubmit(data: FormValues) {
        const entryData = {
            ...data,
            date: format(data.date, 'yyyy-MM-dd'),
        };
        addOrUpdateEntry(entryData);
        toast({
            title: "Sucesso!",
            description: `Dados de ${format(data.date, 'dd/MM/yyyy')} foram salvos.`,
        });
    }

    const renderInput = (name: keyof FormValues, label: string) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                     <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">R$</span>
                        <FormControl>
                            <Input type="number" step="0.01" className="pl-8" {...field} />
                        </FormControl>
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
    );

    return (
        <Card className="sticky top-20">
            <CardHeader>
                <CardTitle>Lançamento Diário</CardTitle>
                <CardDescription>Insira ou edite os dados do dia selecionado no calendário.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data do Lançamento</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP", { locale: ptBR })
                                                    ) : (
                                                        <span>Escolha uma data</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        field.onChange(date);
                                                        setSelectedDate(date);
                                                    }
                                                }}
                                                disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                                                initialFocus
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4 max-h-80 overflow-y-auto pr-4">
                            <h3 className="text-lg font-medium border-b pb-2">Receitas</h3>
                            {renderInput('dineInRevenue', 'Vendas no Salão')}
                            {renderInput('deliveryRevenue', 'Vendas por Delivery')}
                            {renderInput('takeoutRevenue', 'Vendas para Retirada')}
                            
                            <h3 className="text-lg font-medium border-b pb-2 pt-4">Despesas</h3>
                            {renderInput('ingredientCosts', 'Custos com Ingredientes')}
                            {renderInput('wageCosts', 'Custos com Salários')}
                            {renderInput('rentCosts', 'Aluguel e Contas Fixas')}
                            {renderInput('otherCosts', 'Outros Custos Variáveis')}
                        </div>
                        
                        <Button type="submit" className="w-full">
                            <Save className="mr-2 h-4 w-4"/>
                            Salvar Dados do Dia
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
