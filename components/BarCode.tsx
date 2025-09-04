"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

export default function LiveBarcodeScanner() {
    const scannerRef = useRef<HTMLDivElement>(null);
    const [barcode, setBarcode] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>("");

    useEffect(() => {
        // Request camera permission first
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                // Stop the stream (we only wanted to trigger permission dialog)
                stream.getTracks().forEach((track) => track.stop());

                return navigator.mediaDevices.enumerateDevices();
            })
            .then((mediaDevices) => {
                const videoDevices = mediaDevices.filter((d) => d.kind === "videoinput");
                setDevices(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
            })
            .catch((err) => {
                console.error("Camera access denied:", err);
                alert("Please allow camera permissions in your browser settings.");
            });
    }, []);

    useEffect(() => {
        if (!selectedDevice || !scannerRef.current) return;

        // Start Quagga live scanner
        Quagga.init(
            {
                inputStream: {
                    type: "LiveStream",
                    target: scannerRef.current,
                    constraints: {
                        deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
                        facingMode: "environment",
                        width: 320,
                        height: 240,
                    },
                },
                decoder: {
                    readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader"],
                },
                locate: true,
            },
            (err) => {
                if (err) {
                    console.error("Quagga init error:", err);
                    return;
                }
                Quagga.start();
            }
        );

        // On detected
        Quagga.onDetected((res) => {
            if (res?.codeResult?.code) {
                console.log("✅ Barcode detected:", res.codeResult.code);
                setBarcode(res.codeResult.code);
            }
        });

        // Cleanup on unmount
        return () => {
            Quagga.stop();
            Quagga.offDetected(() => { });
        };
    }, [selectedDevice]);

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-3">📸 Live Barcode Scanner</h1>

            {/* Camera Selector */}
            {devices.length > 0 && (
                <div className="mb-3">
                    <label className="mr-2 font-medium">Choose Camera:</label>
                    <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="border p-1 rounded"
                    >
                        {devices.map((device, idx) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${idx + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Scanner Video Feed */}
            <div
                ref={scannerRef}
                style={{
                    width: "320px",
                    height: "240px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    marginBottom: "12px",
                }}
            />

            {/* Barcode Result */}
            {barcode && (
                <div className="mt-3 p-2 bg-green-200 rounded">
                    📦 Detected Barcode: <strong>{barcode}</strong>
                </div>
            )}
        </div>
    );
}
