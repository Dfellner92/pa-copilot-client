"use client";
import { FormProvider, UseFormReturn } from "react-hook-form";

export const ReactHookFormWrapper = ({
  methods,
  onSubmit,
  children,
  className,
}: {
  methods: UseFormReturn<any>;
  onSubmit: (values: any) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
        {children}
      </form>
    </FormProvider>
  );
};
