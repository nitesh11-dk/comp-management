"use client";

import { useState } from "react";
import BarcodeScanner from "@/components/BarCode";

export default function HomePage() {
  const [code, setCode] = useState<string | null>(null);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">📷 Barcode Scanner (Quagga2)</h1>
      {code ? (
        <div className="mt-4 p-2 bg-green-200 rounded">
          ✅ Detected Barcode: <strong>{code}</strong>
        </div>
      ) : (
        <BarcodeScanner onDetected={(c) => setCode(c)} />
      )}
    </div>
  );
}
