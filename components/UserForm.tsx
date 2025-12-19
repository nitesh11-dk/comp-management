"use client";

import { useState } from "react";

export default function UserForm({
  initialData,
  onSubmit,
  buttonText,
  departments = [],
}) {
  const [formData, setFormData] = useState(initialData);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Username validation
    if (name === "username") {
      value = value.toLowerCase();
      const usernameRegex = /^[a-z0-9]*$/;
      if (!usernameRegex.test(value)) {
        setUsernameError(
          "Username can only contain lowercase letters and numbers."
        );
      } else {
        setUsernameError(null);
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) return;

    // Supervisor only → department is required
    if (!formData.departmentId) {
      return alert("Please select a department");
    }

    onSubmit({
      username: formData.username,
      password: formData.password,
      departmentId: formData.departmentId,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-full max-w-md mx-auto bg-white p-6 rounded-xl shadow-md"
    >
      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          type="text"
          name="username"
          placeholder="Enter username"
          value={formData.username}
          onChange={handleChange}
          className={`w-full rounded-lg border p-2.5 outline-none focus:ring-2 ${
            usernameError
              ? "border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
          }`}
          required
        />
        {usernameError && (
          <p className="text-red-500 text-sm mt-1">{usernameError}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none"
          required
        />
      </div>

      {/* Department (Mandatory) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department
        </label>
        <select
          name="departmentId"
          value={formData.departmentId}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none"
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!!usernameError}
        className={`w-full font-semibold py-2.5 rounded-lg shadow-md transition-colors ${
          usernameError
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {buttonText}
      </button>
    </form>
  );
}
