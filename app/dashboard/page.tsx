import React from "react"
import { scanEmployee } from "./actions"
import SupervisorBarcodeScanner from "@/components/supervisor/barcode-scanner"

const Page = async () => {
    // Directly pass server action to client component
    return (
        <div className="p-2 sm:p-6">
            <SupervisorBarcodeScanner scanEmployee={scanEmployee} />
        </div>
    )
}

export default Page
