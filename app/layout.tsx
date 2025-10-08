import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Import react-toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Toast default styles
// import "./toast-custom.css"; // optional for Tailwind overrides

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shree Sai Engineering",
  description: "Complete manpower management solution with attendance tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}

        {/* Toast container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light" // you can switch to dark if you want
        />
      </body>
    </html>
  );
}
