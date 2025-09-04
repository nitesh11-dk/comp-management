"use client";

import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type BarcodeScannerProps = {
    onScan: (decodedText: string) => void;
    fps?: number;
    qrboxSize?: number;
    style?: React.CSSProperties;
    openTriggerCount?: number; // number-based trigger for repeated scanner open
};

export default function BarcodeScanner({
    onScan,
    fps = 10,
    qrboxSize = 250,
    style,
    openTriggerCount = 0,
}: BarcodeScannerProps) {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedRef = useRef<string | null>(null);

    // Detect cameras on mount
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                stream.getTracks().forEach((track) => track.stop());
                return navigator.mediaDevices.enumerateDevices();
            })
            .then((mediaDevices) => {
                const videoDevices = mediaDevices.filter((d) => d.kind === "videoinput");
                setDevices(videoDevices);

                const rearCamera = videoDevices.find((d) =>
                    /rear|back|environment/i.test(d.label)
                );
                setSelectedDevice(rearCamera?.deviceId || videoDevices[0]?.deviceId || null);
            })
            .catch((err) => {
                console.error("Camera access denied:", err);
                alert("Please allow camera permissions in your browser settings.");
            });
    }, []);

    // Open scanner whenever openTriggerCount changes
    useEffect(() => {
        if (openTriggerCount > 0) {
            setScannerOpen(true);
        }
    }, [openTriggerCount]);

    // Start/Stop scanner
    useEffect(() => {
        if (!scannerOpen || !selectedDevice) return;

        const html5QrCode = new Html5Qrcode("reader");

        html5QrCode
            .start(
                { deviceId: { exact: selectedDevice } },
                { fps, qrbox: { width: qrboxSize, height: qrboxSize } },
                (decodedText) => {
                    if (lastScannedRef.current !== decodedText) {
                        lastScannedRef.current = decodedText;
                        onScan(decodedText);

                        // Close scanner after one scan
                        setScannerOpen(false);

                        // Reset last scanned internally after short delay
                        setTimeout(() => (lastScannedRef.current = null), 1500);
                    }
                },
                (errorMessage) => {
                    if (!/NotFoundException/i.test(errorMessage)) {
                        console.warn("QR scan error:", errorMessage);
                    }
                }
            )
            .then(() => {
                scannerRef.current = html5QrCode;
            })
            .catch((err) => console.error("Unable to start scanner:", err));

        return () => {
            if (scannerRef.current) {
                scannerRef.current
                    .stop()
                    .then(() => scannerRef.current?.clear())
                    .catch(() => { });
            }
        };
    }, [scannerOpen, selectedDevice, fps, qrboxSize, onScan]);

    return (
        <div className="p-2 w-full max-w-md mx-auto">
            {/* Camera selector */}
            {devices.length > 1 && (
                <select
                    value={selectedDevice || ""}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="border p-2 rounded mb-4 w-full"
                >
                    {devices.map((device, i) => (
                        <option key={i} value={device.deviceId}>
                            {device.label || `Camera ${i + 1}`}
                        </option>
                    ))}
                </select>
            )}

            {/* Toggle button */}
            <button
                onClick={() => setScannerOpen((prev) => !prev)}
                className="bg-blue-500 text-white py-2 px-4 rounded mb-4 w-full"
            >
                {scannerOpen ? "Close Scanner" : "Open Scanner"}
            </button>

            {/* Scanner container */}
            {scannerOpen && (
                <div
                    id="reader"
                    style={{
                        width: "100%",
                        maxWidth: qrboxSize,
                        aspectRatio: "2 / 1",
                        border: "1px solid #ccc",
                        margin: "0 auto",
                        ...style,
                    }}
                />
            )}
        </div>
    );
}
