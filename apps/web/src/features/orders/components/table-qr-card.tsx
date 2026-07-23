"use client";

import * as React from "react";
import QRCode from "qrcode";
import { DownloadIcon, QrCodeIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiningTable } from "../types";

export function TableQrCard({
  table,
  url,
  onDelete,
}: {
  table: DiningTable;
  url: string;
  onDelete: () => void;
}) {
  const [imageUrl, setImageUrl] = React.useState("");

  React.useEffect(() => {
    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: { dark: "#18181B", light: "#FFFFFF" },
    }).then(setImageUrl);
  }, [url]);

  return (
    <article className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mx-auto grid aspect-square max-w-52 place-items-center overflow-hidden rounded-xl border bg-white p-3">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`QR code for table ${table.number}`} />
        ) : (
          <QrCodeIcon className="size-10 text-muted-foreground" />
        )}
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-lg font-semibold">Table {table.number}</h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{url}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={!imageUrl}
          nativeButton={false}
          render={
            <a
              href={imageUrl}
              download={`table-${table.number}-qr.png`}
              aria-label={`Download table ${table.number} QR code`}
            />
          }
        >
          <DownloadIcon /> Download
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={onDelete}
          aria-label={`Delete table ${table.number}`}
        >
          <Trash2Icon />
        </Button>
      </div>
    </article>
  );
}
