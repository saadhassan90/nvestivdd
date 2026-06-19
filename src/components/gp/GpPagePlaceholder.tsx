interface Props {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function GpPagePlaceholder({ title, description, children, action }: Props) {
  const hasHeader = !!title || !!description || !!action;
  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            {title && <h1 className="text-2xl font-semibold text-foreground">{title}</h1>}
            {description && (
              <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>
        {children ?? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
            Coming soon. Built in the next stage.
          </div>
        )}
      </div>
    </div>
  );
}