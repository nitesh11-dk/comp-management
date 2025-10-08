"use client";

import React from "react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold">AS</div>
          <div>
            <h1 className="text-lg font-semibold">Asan Attendance</h1>
            <p className="text-xs text-slate-500">Supervisor & Admin tools</p>
          </div>
        </div>

        <nav className="hidden sm:flex items-center gap-3">
          <a href="#features" className="text-sm hover:underline">Features</a>
          <a href="#scan" className="text-sm hover:underline">Scan</a>
          <a href="#contact" className="text-sm hover:underline">Contact</a>
          <a href="/login" className="ml-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm shadow-sm hover:bg-indigo-700">Login</a>
        </nav>

        {/* Mobile menu button */}
        <div className="sm:hidden">
          <a href="/login" className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md text-sm">Login</a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">Attendance, simplified for <span className="text-indigo-600">Supervisors</span> & <span className="text-indigo-600">Admins</span></h2>
          <p className="mt-4 text-slate-600">Scan employee QR badges, track in/out logs, and manage attendance from a single, mobile-friendly dashboard.
            Built to be fast, secure, and usable on any device.</p>

          <div className="mt-6 flex gap-3 flex-wrap">
            <a href="/login" className="inline-flex items-center px-4 py-3 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">Get started</a>
            <a href="#features" className="inline-flex items-center px-4 py-3 border border-slate-200 rounded-md text-sm hover:bg-slate-50">See features</a>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold">Live Scan</h3>
              <p className="text-xs text-slate-500 mt-1">Scan QR / NFC to mark attendance instantly.</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold">Role Controls</h3>
              <p className="text-xs text-slate-500 mt-1">Give supervisors the tools they need, admins the controls they expect.</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold">Mobile First</h3>
              <p className="text-xs text-slate-500 mt-1">Fully responsive — works great on phones and tablets.</p>
            </div>
          </div>
        </div>

        {/* Scan / CTA Card */}
        <aside id="scan" className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold">Quick Scan</h3>
          <p className="text-sm text-slate-500 mt-2">Open the scanner to mark employee attendance. You can also manually search employees.</p>

          <div className="mt-4">
            {/* Placeholder for live camera/scanner component */}
            <div className="w-full h-48 rounded-md bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400">Camera / QR Scanner Placeholder</div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                aria-label="Open scanner"
                className="w-full px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                onClick={() => {
                  // Hook: open scanner modal or navigate to scanner page
                  // e.g. router.push('/scan') or open a camera component
                  alert('Open scanner (implement camera/QR logic)');
                }}
              >
                Open Scanner
              </button>

              <a href="/dashboard" className="w-full inline-flex items-center justify-center px-4 py-2 border rounded-md text-sm hover:bg-slate-50">Go to Dashboard</a>
            </div>

            <div className="mt-4 text-xs text-slate-400">Tip: allow camera permissions for the best experience on mobile.</div>
          </div>
        </aside>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold">Supervisor View</h4>
            <p className="text-sm text-slate-500 mt-2">Quick approvals, daily attendance summaries, and exportable reports.</p>
          </div>
          <div className="p-5 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold">Admin Control</h4>
            <p className="text-sm text-slate-500 mt-2">User management, role assignment, audit logs, and settings.</p>
          </div>
          <div className="p-5 bg-white rounded-lg shadow-sm">
            <h4 className="font-semibold">Secure & Reliable</h4>
            <p className="text-sm text-slate-500 mt-2">Token-based auth, secure APIs, and detailed activity logs.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="mt-12 border-t bg-white border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600">© {new Date().getFullYear()} Asan Attendance — Built for supervisors & admins</div>
          <div className="flex items-center gap-3">
            <a href="#" className="text-sm hover:underline">Privacy</a>
            <a href="#" className="text-sm hover:underline">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
