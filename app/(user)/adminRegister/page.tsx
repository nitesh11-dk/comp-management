import { adminRegisterUser } from "@/actions/registerAdmin";

export default function AdminRegisterPage() {
  // 🔒 PAGE-LEVEL GUARD
  if (process.env.ALLOW_BOOTSTRAP_ADMIN !== "true") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-medium">
          Bootstrap admin creation is disabled
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Bootstrap – Create Admin / Supervisor
        </h1>

        <form action={adminRegisterUser} className="space-y-4">
          <input
            name="username"
            placeholder="Username"
            required
            pattern="[a-z0-9]+"
            className="w-full border p-2.5 rounded-lg"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="w-full border p-2.5 rounded-lg"
          />

          <select
            name="role"
            className="w-full border p-2.5 rounded-lg"
          >
            <option value="admin">Admin</option>
            {/* <option value="supervisor">Supervisor</option> */}
          </select>

          <input
            name="departmentId"
            placeholder="Department ID (only for supervisor)"
            className="w-full border p-2.5 rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg"
          >
            Create User
          </button>
        </form>
      </div>
    </div>
  );
}
