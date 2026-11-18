"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBriefSchema,
  type CreateBriefFormValues,
} from "../schemas/brief";

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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { RangeSlider } from "@/components/ui/range-slider";
import { createBrief } from "../api/brief.api";
import type { Brief } from "../types/brief";

export function CreateBriefPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBrief, setCreatedBrief] = useState<Brief | null>(null);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([
    0,
    100000,
  ]);

  const form = useForm<CreateBriefFormValues>({
    resolver: zodResolver(createBriefSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      companyName: "",
      requirements: "",
      budgetRange: "$0 - $100,000",
      targetTimeline: "",
    },
  });

  const formatBudget = ([low, high]: [number, number]) =>
    `$${low.toLocaleString()} - $${high.toLocaleString()}`;

  async function onSubmit(data: CreateBriefFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const brief = await createBrief({
        ...data,
        budgetRange: formatBudget(budgetRange),
      });

      setCreatedBrief(brief);
      setIsSuccess(true);
      form.reset({
        ...data,
        budgetRange: "$0 - $100,000",
      });
      setBudgetRange([0, 100000]);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setIsSuccess(false);
    setCreatedBrief(null);
    setErrorMessage(null);
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <CardContent className="pt-6 flex flex-col items-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
            <h2 className="text-2xl font-bold">
              Brief Submitted Successfully!
            </h2>
            <p className="text-muted-foreground text-sm">
              Thank you! Our AI is currently analyzing your project
              requirements. We will get back to you shortly.
            </p>

            {createdBrief ? (
              <dl className="w-full space-y-2 rounded-none border border-border p-4 text-left text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Brief ID</dt>
                  <dd className="font-mono text-xs break-all">
                    {createdBrief.id}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Pipeline status</dt>
                  <dd>{createdBrief.pipelineStatus}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">AI status</dt>
                  <dd>{createdBrief.aiResult?.aiStatus ?? "-"}</dd>
                </div>
              </dl>
            ) : null}

            <Button onClick={resetForm} className="mt-4 w-full">
              Submit Another Brief
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[90vh] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Start a Project Brief
          </CardTitle>
          <CardDescription>
            Tell us about your vision, and let our AI-powered system help scope
            your project instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {errorMessage ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company / Organization</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Fugo Creative Client Co."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Requirements & Scope</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your goals, features needed, target audience, or design preferences..."
                        className="min-h-30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="budgetRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Range</FormLabel>
                      <FormControl>
                        <RangeSlider
                          value={budgetRange}
                          onChange={(next) => {
                            setBudgetRange(next);
                            field.onChange(formatBudget(next));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetTimeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Timeline / Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting & Processing AI...
                  </>
                ) : (
                  "Submit Brief"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
