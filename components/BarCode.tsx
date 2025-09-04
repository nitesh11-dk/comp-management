"use client";

import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type BarcodeScannerProps = {
    onScan: (decodedText: string) => void; // callback for scanned codes
    fps?: number; // optional frames per second
    qrboxSize?: number; // optional size of scanning box
    style?: React.CSSProperties; // optional styling for the scanner container
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

    // 🔹 Get video devices on mount
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                stream.getTracks().forEach((track) => track.stop()); // stop temporary stream
                return navigator.mediaDevices.enumerateDevices();
            })
            .then((mediaDevices) => {
                const videoDevices = mediaDevices.filter((d) => d.kind === "videoinput");
                setDevices(videoDevices);
                if (videoDevices.length > 0) setSelectedDevice(videoDevices[0].deviceId);
            })
            .catch((err) => {
                console.error("Camera access denied:", err);
                alert("Please allow camera permissions in your browser settings.");
            });
    }, []);

    // 🔹 Initialize & start scanner when a device is selected
    useEffect(() => {
        if (!selectedDevice) return;

        const html5QrCode = new Html5Qrcode("reader");

        html5QrCode
            .start(
                { deviceId: { exact: selectedDevice } },
                { fps, qrbox: { width: qrboxSize, height: qrboxSize } },
                (decodedText) => {
                    // ✅ Prevent duplicate scans
                    if (lastScannedRef.current !== decodedText) {
                        lastScannedRef.current = decodedText;
                        onScan(decodedText);

                        // Reset lastScanned after 1 second so same code can be scanned again
                        setTimeout(() => (lastScannedRef.current = null), 1000);
                    }
                },
                (errorMessage) => console.log("Scanning error:", errorMessage)
            )
            .then(() => {
                scannerRef.current = html5QrCode;
            })
            .catch((err) => console.error("Unable to start scanner:", err));

        return () => {
            html5QrCode
                .stop()
                .then(() => html5QrCode.clear())
                .catch((err) => console.error("Stop failed:", err));
        };
    }, [selectedDevice, fps, qrboxSize, onScan]);

    return (
        <div className="p-4">
            {/* Camera selector */}
            <select
                value={selectedDevice || ""}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="border p-2 rounded mb-4"
            >
                {devices.map((device, i) => (
                    <option key={i} value={device.deviceId}>
                        {device.label || `Camera ${i + 1}`}
                    </option>
                ))}
            </select>

            {/* Scanner container */}
            <div
                id="reader"
                style={{ width: qrboxSize, height: qrboxSize, border: "1px solid #ccc", ...style }}
            ></div>
        </div>
    );
}
