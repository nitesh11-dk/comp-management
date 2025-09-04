"use client";

import { useRef, useState, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function ZXingPhotoScanner() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [result, setResult] = useState<string>("");

    // List cameras on mount
    useEffect(() => {
        BrowserMultiFormatReader.listVideoInputDevices()
            .then((videoDevices) => {
                setDevices(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[0].deviceId); // default first
                }
            })
            .catch((err) => console.error("Device error:", err));
    }, []);

    // Start camera
    const startCamera = async () => {
        if (!selectedDeviceId) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: selectedDeviceId } },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    // Capture photo from video
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext("2d");
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const imgData = canvasRef.current.toDataURL("image/png");
                setCapturedImage(imgData);

                // Stop video stream after capture
                const stream = videoRef.current.srcObject as MediaStream;
                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                }
            }
        }
    };

    // Scan captured photo
    const scanPhoto = async () => {
        if (capturedImage) {
            try {
                const reader = new BrowserMultiFormatReader();
                const res = await reader.decodeFromImageUrl(capturedImage);
                setResult(res.getText());
            } catch (err) {
                console.error("Scan failed:", err);
                setResult("No barcode/QR code detected.");
            }
        }
    };

    return (
        <div className="p-4 flex flex-col items-center gap-4">
            {/* Camera Selector */}
            {!capturedImage && (
                <div>
                    <label className="mr-2">Select Camera: </label>
                    <select
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                    >
                        {devices.map((d, i) => (
                            <option key={i} value={d.deviceId}>
                                {d.label || `Camera ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Video stream */}
            {!capturedImage && (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        className="w-80 border rounded-lg shadow"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={startCamera}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            Start Camera
                        </button>
                        <button
                            onClick={capturePhoto}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg"
                        >
                            Capture Photo
                        </button>
                    </div>
                </>
            )}

            {/* Captured image preview */}
            {capturedImage && (
                <>
                    <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-80 border rounded-lg shadow"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={scanPhoto}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                        >
                            Scan Captured Photo
                        </button>
                        <button
                            onClick={() => {
                                setCapturedImage(null);
                                setResult("");
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg"
                        >
                            Retake
                        </button>
                    </div>
                </>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden"></canvas>

            {/* Result */}
            <p className="mt-4 text-lg font-semibold">
                {result ? `Result: ${result}` : "No scan result yet"}
            </p>
        </div>
    );
}
