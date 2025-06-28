"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Separator } from "./ui/separator";
import { Slider } from "@/components/ui/slider";

const formSchema = z.object({
  revenue: z.coerce.number().min(0, "A receita deve ser um número positivo."),
  expenses: z.coerce.number().min(0, "As despesas devem ser um número positivo."),
  ingredientCosts: z.coerce.number().min(0, "O custo com ingredientes deve ser um número positivo."),
  wageCosts: z.coerce.number().min(0, "O custo com salários deve ser um número positivo."),
  rentCosts: z.coerce.number().min(0, "O custo com aluguel deve ser um número positivo."),
  pricingStrategy: z.string().min(10, "Por favor, descreva sua estratégia de preços em pelo menos 10 caracteres."),
});

type FormValues = z.infer<typeof formSchema>;

export function FinancialForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      revenue: 45000,
      expenses: 28000,
      ingredientCosts: 12000,
      wageCosts: 10000,
      rentCosts: 6000,
      pricingStrategy: "O preço médio por pizza é de R$55. Oferecemos 10% de desconto em pedidos acima de R$120.",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setResult(null);

    const response = await getRecommendationsAction(values);

    if (response.success && response.data) {
      setResult(response.data.recommendations);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receita Total</FormLabel>
                <div className="flex items-center gap-4">
                  <FormControl>
                    <Slider
                      min={0}
                      max={100000}
                      step={1000}
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
            name="expenses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Despesas Totais</FormLabel>
                <div className="flex items-center gap-4">
                  <FormControl>
                    <Slider
                      min={0}
                      max={100000}
                      step={1000}
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

      {result && (
        <div className="space-y-4 pt-4">
            <Separator />
            <h3 className="text-lg font-semibold font-headline">Recomendações da IA</h3>
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-sm text-muted-foreground whitespace-pre-wrap">
                {result}
            </div>
        </div>
      )}
    </div>
  );
}
