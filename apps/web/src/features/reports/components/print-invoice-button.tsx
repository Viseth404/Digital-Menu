"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintInvoiceButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      <PrinterIcon /> Print / Save PDF
    </Button>
  );
}
