"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import Quagga from "@ericblade/quagga2";

export default function CameraBarcodeScanner() {
    const webcamRef = useRef<Webcam>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [barcode, setBarcode] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>("");

    useEffect(() => {
        // Request permission first
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                // Stop stream after permission granted (we only needed the access prompt)
                stream.getTracks().forEach((track) => track.stop());

                // Now enumerate devices
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


    const capturePhoto = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setPreview(imageSrc);
            decodeBarcode(imageSrc);
        }
    };

    const decodeBarcode = (imageSrc: string) => {
        Quagga.decodeSingle(
            {
                src: imageSrc,
                numOfWorkers: 0,
                inputStream: { size: 800 },
                decoder: {
                    readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader"],
                },
            },
            (res) => {
                if (res?.codeResult?.code) {
                    console.log("✅ Barcode detected:", res.codeResult.code);
                    setBarcode(res.codeResult.code);
                } else {
                    console.log("❌ No barcode found");
                    setBarcode("❌ No barcode found");
                }
            }
        );
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-3">📸 Camera Barcode Scanner</h1>

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

            {/* Webcam or Preview */}
            {!preview && selectedDevice && (
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
                        facingMode: "environment",
                        width: 320, // 👈 Smaller width
                        height: 240, // 👈 Smaller height
                    }}
                    style={{
                        width: "320px",
                        height: "240px",
                        borderRadius: "8px",
                        border: "2px solid #ddd",
                    }}
                />
            )}

            {/* Buttons */}
            <div className="mt-3 flex gap-2">
                {!preview && (
                    <button
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Capture
                    </button>
                )}
                {preview && (
                    <button
                        onClick={() => {
                            setPreview(null);
                            setBarcode(null);
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded"
                    >
                        Retake
                    </button>
                )}
            </div>

            {/* Preview */}
            {preview && (
                <div className="mt-4">
                    <img src={preview} alt="Captured" className="max-h-64 border" />
                </div>
            )}

            {/* Barcode Result */}
            {barcode && (
                <div className="mt-3 p-2 bg-green-200 rounded">
                    📦 Detected Barcode: <strong>{barcode}</strong>
                </div>
            )}
        </div>
    );
}
