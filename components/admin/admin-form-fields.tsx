import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

function FieldShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-white">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-white/45">{hint}</span> : null}
    </label>
  );
}

const baseInputClassName =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/30 focus:bg-black/30";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function TextField({
  label,
  hint,
  className,
  ...props
}: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <input className={`${baseInputClassName} ${className ?? ""}`} {...props} />
    </FieldShell>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <textarea
        className={`${baseInputClassName} min-h-28 resize-y ${className ?? ""}`}
        {...props}
      />
    </FieldShell>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function SelectField({
  label,
  hint,
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <select className={`${baseInputClassName} ${className ?? ""}`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}

interface MultiSelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "value" | "onChange"> {
  label: string;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
  children: ReactNode;
}

export function MultiSelectField({
  label,
  hint,
  value,
  onChange,
  className,
  children,
  ...props
}: MultiSelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <select
        multiple
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(Array.from(event.target.selectedOptions, (option) => option.value))
        }
        className={`${baseInputClassName} min-h-32 ${className ?? ""}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

interface CheckboxFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export function CheckboxField({
  label,
  description,
  className,
  ...props
}: CheckboxFieldProps) {
  return (
    <label className={`flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm ${className ?? ""}`}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-400" {...props} />
      <span className="space-y-1">
        <span className="block font-medium text-white">{label}</span>
        {description ? (
          <span className="block text-xs text-white/45">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
