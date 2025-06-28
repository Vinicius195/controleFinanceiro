"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getRecommendationsAction } from "@/app/actions";
import { Slider } from "@/components/ui/slider";
import { FinancialRecommendationsInput, FinancialRecommendationsInputSchema } from "@/ai/schemas/financial-recommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";


const formSchema = FinancialRecommendationsInputSchema.omit({ revenue: true, expenses: true }).extend({
  dineInRevenue: z.coerce.number(),
  deliveryRevenue: z.coerce.number(),
  takeoutRevenue: z.coerce.number(),
  ingredientCosts: z.coerce.number(),
  wageCosts: z.coerce.number(),
  rentCosts: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

interface FinancialFormProps {
  data: FinancialRecommendationsInput;
  onDataChange: (data: FormValues) => void;
}

export function FinancialForm({ data, onDataChange }: FinancialFormProps) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      dineInRevenue: data.dineInRevenue,
      deliveryRevenue: data.deliveryRevenue,
      takeoutRevenue: data.takeoutRevenue,
      ingredientCosts: data.ingredientCosts,
      wageCosts: data.wageCosts,
      rentCosts: data.rentCosts,
      pricingStrategy: data.pricingStrategy,
      recipes: data.recipes,
    },
  });

  const { watch } = form;

  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange(value as FormValues);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange]);


  async function onSubmit(values: FormValues) {
    setLoading(true);
    setRecommendations(null);

    const revenue = values.dineInRevenue + values.deliveryRevenue + values.takeoutRevenue;
    const expenses = values.ingredientCosts + values.wageCosts + values.rentCosts;

    const fullData: FinancialRecommendationsInput = {
      ...values,
      revenue,
      expenses,
    };

    const response = await getRecommendationsAction(fullData);

    if (response.success && response.data) {
      setRecommendations(response.data.recommendations);
      setIsDialogOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Ocorreu um erro",
        description: response.error,
      });
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receitas</CardTitle>
              <CardDescription>Insira os valores das suas fontes de receita.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField
                control={form.control}
                name="dineInRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendas no Salão</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider
                          min={0}
                          max={50000}
                          step={500}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          className="w-32 pl-8"
                          {...field}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendas por Delivery</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider
                          min={0}
                          max={50000}
                          step={500}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          className="w-32 pl-8"
                          {...field}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="takeoutRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendas para Retirada</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider
                          min={0}
                          max={50000}
                          step={500}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          className="w-32 pl-8"
                          {...field}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Despesas</CardTitle>
              <CardDescription>Insira os valores das suas principais despesas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="ingredientCosts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custos com Ingredientes</FormLabel>
                     <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider
                          min={0}
                          max={50000}
                          step={500}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                       <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          className="w-32 pl-8"
                          {...field}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wageCosts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custos com Salários</FormLabel>
                     <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider
                          min={0}
                          max={50000}
                          step={500}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                       <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          className="w-32 pl-8"
                          {...field}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rentCosts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custos com Aluguel</FormLabel>
                     <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider
                          min={0}
                          max={20000}
                          step={500}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                       <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          className="w-32 pl-8"
                          {...field}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estratégia e Produtos</CardTitle>
              <CardDescription>Forneça mais contexto para a IA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField
                control={form.control}
                name="pricingStrategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estratégia de Preços</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva sua estratégia de preços atual..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principais Receitas de Pizza</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva suas principais pizzas, ingredientes, etc."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Obtendo Recomendações...
              </>
            ) : (
              "Obter Recomendações"
            )}
          </Button>
        </form>
      </Form>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-accent" />
                Recomendações da IA
              </DialogTitle>
              <DialogDescription>
                Com base nos dados fornecidos, aqui estão algumas sugestões para otimizar a lucratividade da sua pizzaria.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
                <div className="p-4 bg-muted/50 rounded-lg border text-sm text-muted-foreground whitespace-pre-wrap">
                    {recommendations}
                </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
