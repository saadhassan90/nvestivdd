import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { EditableText } from "@/components/iris/EditableText";

export default function Contacts() {
  return (
    <GpPagePlaceholder>
      <div className="mb-6">
        <EditableText
          as="h1"
          className="text-2xl font-semibold text-foreground"
          sectionKey="title"
          label="Page title"
          schema="text"
          defaultValue="Contacts"
        />
        <EditableText
          as="p"
          className="text-sm text-muted-foreground mt-1.5 max-w-2xl"
          sectionKey="description"
          label="Page description"
          defaultValue="GP-side CRM. LPs and placement agents."
        />
      </div>
      <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
        Coming soon. Built in the next stage.
      </div>
    </GpPagePlaceholder>
  );
}