interface Props {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function GpPagePlaceholder({ title, description, children }: Props) {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>
      )}
      <div className="mt-8">
        {children ?? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
            Coming soon. Built in the next stage.
          </div>
        )}
      </div>
    </div>
  );
}