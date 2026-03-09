import { useState, useEffect } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { Loader2 } from "lucide-react";

export function ProcessingState() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="flex items-center justify-center py-20">
      <Card shadow="sm" className="w-96 text-center">
        <CardBody className="p-8">
          <Spinner size="lg" color="primary" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">Analysis in Progress</h3>
          <p className="text-sm text-default-400 mt-2">
            Your analysis is being processed. This typically takes 3–5 minutes.
          </p>
          <p className="text-xs text-default-400 mt-3 font-mono">
            Elapsed: {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
