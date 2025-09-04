"use client";

import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type BarcodeScannerProps = {
    onScan: (decodedText: string) => void;
    fps?: number;
    qrboxSize?: number;
    style?: React.CSSProperties;
};

export default function BarcodeScanner({
    onScan,
    fps = 10,
    qrboxSize = 250,
    style,
}: BarcodeScannerProps) {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedRef = useRef<string | null>(null); // store last scanned code

    // 🔹 Detect cameras on mount
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

                // Prefer rear camera on mobile
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

    // 🔹 Start scanner when a device is selected
    useEffect(() => {
        if (!selectedDevice) return;

        const html5QrCode = new Html5Qrcode("reader");

        html5QrCode
            .start(
                { deviceId: { exact: selectedDevice } },
                { fps, qrbox: { width: qrboxSize, height: qrboxSize } },
                (decodedText) => {
                    // ✅ Prevent duplicate scans in a short interval
                    if (lastScannedRef.current !== decodedText) {
                        lastScannedRef.current = decodedText;
                        onScan(decodedText);

                        // Reset after 1.5 seconds to allow same code to be scanned again
                        setTimeout(() => (lastScannedRef.current = null), 1500);
                    }
                },
                (errorMessage) => {
                    // Ignore "NotFoundException" to prevent infinite loop spam
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
            // ✅ Stop & clear safely
            if (scannerRef.current) {
                scannerRef.current
                    .stop()
                    .then(() => scannerRef.current?.clear())
                    .catch(() => {
                        /* ignore stop errors */
                    });
            }
        };
    }, [selectedDevice, fps, qrboxSize, onScan]);

    return (
        <div className="p-2 w-full max-w-md mx-auto">
            {/* Camera selector (only if multiple cameras) */}
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

            {/* Scanner container */}
            <div
                id="reader"
                style={{
                    width: "100%",
                    maxWidth: qrboxSize,
                    aspectRatio: "1 / 1",
                    border: "1px solid #ccc",
                    margin: "0 auto",
                    ...style,
                }}
            />
        </div>
    );
}
