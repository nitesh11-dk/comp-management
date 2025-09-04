"use client";

import { useState } from "react";
import BarcodeScanner from "@/components/BarCode";

export default function HomePage() {
  const [code, setCode] = useState<string | null>(null);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">📷 Quagga2 Barcode Scanner</h1>

      {code ? (
        <div className="mt-4 p-2 bg-green-200 rounded">
          ✅ Detected: <strong>{code}</strong>
        </div>
      ) : (
        <BarcodeScanner onDetected={(c) => setCode(c)} />
      )}
    </div>
  );
}
