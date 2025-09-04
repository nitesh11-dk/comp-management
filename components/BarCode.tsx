"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

export default function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
    const scannerRef = useRef<HTMLDivElement>(null);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCam, setSelectedCam] = useState<string>("");

    // Get available cameras on mount
    useEffect(() => {
        Quagga.CameraAccess.enumerateVideoDevices()
            .then((devices) => {
                setCameras(devices);
                if (devices.length > 0) {
                    setSelectedCam(devices[0].deviceId); // default to first camera
                }
            })
            .catch((err) => console.error("Camera enum error:", err));
    }, []);

    // Initialize scanner whenever selectedCam changes
    useEffect(() => {
        if (!scannerRef.current || !selectedCam) return;

        Quagga.init(
            {
                inputStream: {
                    type: "LiveStream",
                    target: scannerRef.current,
                    constraints: {
                        deviceId: selectedCam, // use selected camera
                    },
                },
                decoder: {
                    readers: ["code_128_reader", "ean_reader", "ean_8_reader"], // barcode formats
                },
            },
            (err) => {
                if (err) {
                    console.error("Quagga init error:", err);
                    return;
                }
                Quagga.start();
            }
        );

        Quagga.onDetected((result) => {
            if (result?.codeResult?.code) {
                onDetected(result.codeResult.code);
                Quagga.stop();
            }
        });

        return () => {
            Quagga.stop();
            Quagga.offDetected(() => { });
        };
    }, [selectedCam, onDetected]);

    return (
        <div>
            {/* Camera Selector */}
            <div className="mb-2">
                <label className="font-medium mr-2">Choose Camera:</label>
                <select
                    value={selectedCam}
                    onChange={(e) => setSelectedCam(e.target.value)}
                    className="border rounded p-1"
                >
                    {cameras.map((cam, idx) => (
                        <option key={cam.deviceId} value={cam.deviceId}>
                            {cam.label || `Camera ${idx + 1}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Scanner */}
            <div ref={scannerRef} style={{ width: "100%", height: "400px" }} />
        </div>
    );
}
