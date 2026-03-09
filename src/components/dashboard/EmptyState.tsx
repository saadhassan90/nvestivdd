import { Card, CardBody, Button } from "@heroui/react";
import { BarChart3, Plus } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";

interface EmptyStateProps {
  onNewDeal: () => void;
}

export function EmptyState({ onNewDeal }: EmptyStateProps) {
  return (
    <BlurFade>
      <Card shadow="sm">
        <CardBody className="flex flex-col items-center justify-center py-20 px-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-default-100">
            <BarChart3 className="h-8 w-8 text-default-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welcome to Nvestiv</h2>
          <p className="mt-2 text-sm text-default-500 max-w-sm text-center">
            Upload a fund document to begin your first analysis
          </p>
          <div className="mt-6">
            <Button color="primary" startContent={<Plus className="h-4 w-4" />} onPress={onNewDeal}>
              New Deal
            </Button>
          </div>
        </CardBody>
      </Card>
    </BlurFade>
  );
}
