import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FormField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "radio";
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

export function InteractiveForm({
  title,
  fields,
  submitLabel,
  answered,
  onSubmit,
}: {
  title?: string;
  fields: FormField[];
  submitLabel?: string;
  answered?: boolean;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const submit = () => {
    for (const f of fields) {
      if (f.required && !values[f.key]) return;
    }
    onSubmit(values);
  };

  return (
    <div className="not-prose my-2 rounded-xl border border-border bg-muted/40 p-3 space-y-3">
      {title && <div className="text-[12px] font-medium text-foreground">{title}</div>}
      <div className="space-y-2.5">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">
              {f.label}
              {f.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {f.type === "text" && (
              <Input
                disabled={answered}
                value={values[f.key] || ""}
                placeholder={f.placeholder}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-8 text-[12px]"
              />
            )}
            {f.type === "number" && (
              <Input
                disabled={answered}
                type="number"
                value={values[f.key] || ""}
                placeholder={f.placeholder}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-8 text-[12px]"
              />
            )}
            {f.type === "select" && (
              <Select
                disabled={answered}
                value={values[f.key]}
                onValueChange={(v) => set(f.key, v)}
              >
                <SelectTrigger className="h-8 text-[12px]">
                  <SelectValue placeholder={f.placeholder || "Select…"} />
                </SelectTrigger>
                <SelectContent>
                  {(f.options || []).map((o) => (
                    <SelectItem key={o} value={o} className="text-[12px]">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {f.type === "radio" && (
              <RadioGroup
                disabled={answered}
                value={values[f.key]}
                onValueChange={(v) => set(f.key, v)}
                className="flex flex-wrap gap-3"
              >
                {(f.options || []).map((o) => (
                  <label key={o} className="flex items-center gap-1.5 text-[12px] text-foreground">
                    <RadioGroupItem value={o} id={`${f.key}-${o}`} />
                    {o}
                  </label>
                ))}
              </RadioGroup>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={answered}
          onClick={submit}
          className="h-7 text-[11px]"
        >
          {submitLabel || "Submit"}
        </Button>
      </div>
    </div>
  );
}