
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
  FormDescription,
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

const formSchema = z.object({
  revenue: z.coerce.number().min(0, "Revenue must be a positive number."),
  expenses: z.coerce.number().min(0, "Expenses must be a positive number."),
  ingredientCosts: z.coerce.number().min(0, "Ingredient costs must be a positive number."),
  wageCosts: z.coerce.number().min(0, "Wage costs must be a positive number."),
  rentCosts: z.coerce.number().min(0, "Rent costs must be a positive number."),
  pricingStrategy: z.string().min(10, "Please describe your pricing strategy in at least 10 characters."),
});

type FormValues = z.infer<typeof formSchema>;

export function FinancialForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      revenue: 25000,
      expenses: 15000,
      ingredientCosts: 8000,
      wageCosts: 5000,
      rentCosts: 2000,
      pricingStrategy: "Average price per pizza is $15. We offer a 10% discount on orders over $50.",
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
        title: "An error occurred",
        description: response.error,
      });
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="revenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Revenue ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 45000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expenses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Expenses ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 28000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ingredientCosts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredient Costs ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 12000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wageCosts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wage Costs ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rentCosts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rent Costs ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 6000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="pricingStrategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pricing Strategy</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe your current pricing strategy..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Recommendations...
              </>
            ) : (
              "Get Recommendations"
            )}
          </Button>
        </form>
      </Form>

      {result && (
        <div className="space-y-4 pt-4">
            <Separator />
            <h3 className="text-lg font-semibold font-headline">AI Recommendations</h3>
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-sm text-muted-foreground whitespace-pre-wrap">
                {result}
            </div>
        </div>
      )}
    </div>
  );
}
