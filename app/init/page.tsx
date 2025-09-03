"use client";

import { useState } from "react";
import { seedDepartments } from "./actions";

export default function InitPage() {
  const [status, setStatus] = useState("");

  const handleClick = async () => {
    setStatus("Seeding...");
    const result = await seedDepartments();
    setStatus(result);
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="p-4">
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Seed Departments
        </button>
        {status && <p className="mt-2 text-sm">{status}</p>}
      </div>
    </div>
  );
}
