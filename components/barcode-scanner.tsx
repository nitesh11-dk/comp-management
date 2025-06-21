"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, CameraOff, Upload, AlertTriangle } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (result: string) => void
  isActive: boolean
  onToggle: () => void
}

export default function BarcodeScanner({ onScan, isActive, onToggle }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [manualInput, setManualInput] = useState("")
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown")
  const [fallbackMode, setFallbackMode] = useState(false)

  useEffect(() => {
    checkCameraPermissions()
  }, [])

  useEffect(() => {
    if (isActive && !fallbackMode) {
      startScanner()
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isActive, fallbackMode])

  const checkCameraPermissions = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission("denied")
        setFallbackMode(true)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraPermission("granted")
      stream.getTracks().forEach((track) => track.stop()) // Stop the test stream
    } catch (err) {
      setCameraPermission("denied")
      setFallbackMode(true)
      setError("Camera access denied. Using fallback input methods.")
    }
  }

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
          useBarCodeDetectorIfSupported: true,
          showZoomSliderIfSupported: true,
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
          if (!error.includes("NotFoundException") && !error.includes("No MultiFormat Readers")) {
            console.warn("Scanner error:", error)
          }
        },
      )

      setError("")
    } catch (err) {
      setError("Failed to start camera scanner. Switching to fallback mode.")
      setFallbackMode(true)
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

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput("")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // For demo purposes, we'll simulate a successful scan
      // In a real app, you'd use a library to decode the barcode from the image
      const fileName = file.name.toLowerCase()
      if (fileName.includes("barcode") || fileName.includes("qr")) {
        // Simulate extracting barcode data from filename or use actual barcode reading library
        onScan("DEMO_SCAN_FROM_FILE")
      } else {
        setError("Please upload a valid barcode image")
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
            {cameraPermission === "denied" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          </span>
          <div className="flex gap-2">
            {!fallbackMode && (
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
            )}
            <Button onClick={() => setFallbackMode(!fallbackMode)} variant="outline" size="sm">
              {fallbackMode ? "Use Camera" : "Use Manual"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {cameraPermission === "denied" && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Camera access is required for barcode scanning. Please enable camera permissions in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        {fallbackMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-input">Manual Barcode Entry</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-input"
                  placeholder="Enter employee code or barcode"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
                />
                <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                  Scan
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload Barcode Image</Label>
              <div className="flex gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
            </div>
          </div>
        ) : isActive ? (
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
            <p className="text-xs mt-2">Or use "Manual" mode if camera is not available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
