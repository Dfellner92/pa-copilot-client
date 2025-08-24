"use client";
import { useFormContext } from "react-hook-form";

export const ReactHookFormField = ({
  name,
  label,
  children,
  errorBelow = true,
}: {
  name: string;
  label?: string;
  children: React.ReactNode;
  errorBelow?: boolean;
}) => {
  const {
    formState: { errors },
  } = useFormContext();
  const err = (errors as any)[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      {children}
      {err && (
        <p className={`text-sm text-red-600 ${errorBelow ? "" : "mt-0"}`}>
          {err}
        </p>
      )}
    </div>
  );
};
