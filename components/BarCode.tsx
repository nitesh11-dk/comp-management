import React, { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function BarcodeScanner() {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [scanner, setScanner] = useState(null);

    useEffect(() => {
        // Request permission & list devices
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
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
        if (selectedDevice) {
            const html5QrCode = new Html5Qrcode("reader");

            html5QrCode
                .start(
                    { deviceId: { exact: selectedDevice } },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        console.log("Scanned result:", decodedText);
                        alert(`Scanned code: ${decodedText}`);
                    },
                    (errorMessage) => {
                        // Optional: handle scan errors
                        console.log("Scanning error:", errorMessage);
                    }
                )
                .then(() => setScanner(html5QrCode))
                .catch((err) => console.error("Unable to start scanner:", err));

            return () => {
                html5QrCode.stop().catch((err) => console.error("Stop failed:", err));
            };
        }
    }, [selectedDevice]);

    return (
        <div className="p-4">
            <h1 className="text-lg font-bold mb-2">Barcode Scanner</h1>

            {/* Dropdown for camera selection */}
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
                style={{ width: "300px", height: "300px", border: "1px solid #ccc" }}
            ></div>
        </div>
    );
}
