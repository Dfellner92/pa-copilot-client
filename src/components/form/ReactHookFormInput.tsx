"use client";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";

export const ReactHookFormInput = ({
  name,
  placeholder,
  type = "text",
  className,
}: {
  name: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
}) => {
  const { register } = useFormContext();
  return (
    <Input
      {...register(name)}
      placeholder={placeholder}
      type={type}
      className={className}
    />
  );
};
