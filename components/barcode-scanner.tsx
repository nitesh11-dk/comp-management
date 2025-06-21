"use client"

import { useEffect, useRef, useState } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (result: string) => void
  isActive: boolean
  onToggle: () => void
}

export default function BarcodeScanner({ onScan, isActive, onToggle }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isActive) {
      startScanner()
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isActive])

  const startScanner = () => {
    if (scannerRef.current) {
      stopScanner()
    }

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "barcode-scanner",
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 2.0,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        false,
      )

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText)
          setError("")
        },
        (error) => {
          // Ignore frequent scanning errors
          if (!error.includes("NotFoundException")) {
            console.warn("Scanner error:", error)
          }
        },
      )

      setError("")
    } catch (err) {
      setError("Failed to start camera. Please check permissions.")
      console.error("Scanner initialization error:", err)
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.warn("Error stopping scanner:", err)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Barcode Scanner
          </span>
          <Button onClick={onToggle} variant={isActive ? "destructive" : "default"} size="sm">
            {isActive ? (
              <>
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Scanner
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Start Scanner
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isActive ? (
          <div className="space-y-4">
            <div id="barcode-scanner" className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Point your camera at an employee barcode to scan
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Start Scanner" to begin scanning barcodes</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
