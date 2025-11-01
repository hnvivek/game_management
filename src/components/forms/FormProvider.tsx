"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import { useForm, FormProvider as ReactHookFormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface FormContextType {
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
}

interface FormProviderProps<T extends z.ZodSchema> {
  children: ReactNode;
  schema: T;
  defaultValues?: z.infer<T>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  mode?: "onSubmit" | "onBlur" | "onChange" | "onTouched" | "all";
}

export function FormProvider<T extends z.ZodSchema>({
  children,
  schema,
  defaultValues,
  onSubmit,
  mode = "onSubmit",
}: FormProviderProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  });

  const handleFormSubmit = async (data: z.infer<T>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContext.Provider value={{ isSubmitting, setIsSubmitting }}>
      <ReactHookFormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleFormSubmit)}>
          {children}
        </form>
      </ReactHookFormProvider>
    </FormContext.Provider>
  );
}