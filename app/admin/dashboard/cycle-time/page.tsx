"use client";

import { useEffect, useState } from "react";
import {
  getCycleTimings,
  createCycleTiming,
  updateCycleTiming,
  deleteCycleTiming,
} from "@/actions/cycleTimings";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function CycleTimingsPage() {
  const router = useRouter();

  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    startDay: 1,
    lengthDays: 30,
    description: "",
  });

  const [newCycle, setNewCycle] = useState({
    name: "",
    startDay: 1,
    lengthDays: 30,
    description: "",
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ---------------- LOAD ---------------- */
  const loadCycles = async () => {
    setLoading(true);
    const res = await getCycleTimings();
    if (res.success) setCycles(res.data || []);
    else toast.error("Failed to load cycle timings");
    setLoading(false);
  };

  useEffect(() => {
    loadCycles();
  }, []);

  /* ---------------- CREATE ---------------- */
  const handleCreate = async (e: any) => {
    e.preventDefault();

    if (!newCycle.name) {
      toast.error("Name required");
      return;
    }

    setIsCreating(true);
    const res = await createCycleTiming({
      name: newCycle.name,
      startDay: Number(newCycle.startDay),
      lengthDays: Number(newCycle.lengthDays),
      description: newCycle.description || undefined,
    });

    if (res.success) {
      toast.success("Cycle timing created");
      setCycles((prev) => [res.data, ...prev]); // Add to state
      setNewCycle({ name: "", startDay: 1, lengthDays: 30, description: "" });
    } else toast.error(res.message);
    setIsCreating(false);
  };

  /* ---------------- EDIT ---------------- */
  const startEdit = (cycle: any) => {
    setEditId(cycle.id);
    setEditForm({
      name: cycle.name,
      startDay: cycle.startDay,
      lengthDays: cycle.lengthDays,
      description: cycle.description || "",
    });
  };

  const saveEdit = async (id: string) => {
    setIsUpdating(true);
    const res = await updateCycleTiming(id, {
      name: editForm.name,
      startDay: Number(editForm.startDay),
      lengthDays: Number(editForm.lengthDays),
      description: editForm.description || null,
    });

    if (res.success) {
      toast.success("Updated successfully");
      setCycles((prev) =>
        prev.map((c) => (c.id === id ? res.data : c))
      ); // Update in state
      setEditId(null);
    } else toast.error(res.message);
    setIsUpdating(false);
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  /* ---------------- DELETE ---------------- */
  const confirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    const res = await deleteCycleTiming(deleteId);

    if (res.success) {
      toast.success("Cycle timing deleted");
      setCycles((prev) => prev.filter((c) => c.id !== deleteId)); // Remove from state
      setDeleteId(null);
    } else {
      toast.error(res.message);
    }
    setIsDeleting(false);
  };

  return (
    <div className="p-2 space-y-6">

      {/* BACK */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/admin/dashboard")}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <h1 className="text-2xl font-bold">Cycle Timing Management</h1>

      {/* ADD */}
      <Card className="w-full md:max-w-lg">
        <CardHeader>
          <CardTitle>Add Cycle Timing</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">

            <Input
              placeholder="Cycle Name"
              value={newCycle.name}
              onChange={(e) =>
                setNewCycle({ ...newCycle, name: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                min={1}
                max={28}
                placeholder="Start Day"
                value={newCycle.startDay}
                onChange={(e) =>
                  setNewCycle({ ...newCycle, startDay: Number(e.target.value) })
                }
              />

              <Input
                type="number"
                min={1}
                max={31}
                placeholder="Length (days)"
                value={newCycle.lengthDays}
                onChange={(e) =>
                  setNewCycle({
                    ...newCycle,
                    lengthDays: Number(e.target.value),
                  })
                }
              />
            </div>

            <Input
              placeholder="Description (optional)"
              value={newCycle.description}
              onChange={(e) =>
                setNewCycle({ ...newCycle, description: e.target.value })
              }
            />

            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? "Creating..." : "Add Cycle Timing"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>All Cycle Timings</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <div className="overflow-auto max-h-96">
              <table className="w-full border text-xs md:text-sm min-w-max">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 md:px-3 py-2">Name</th>
                    <th className="border px-2 md:px-3 py-2 text-center">Start Day</th>
                    <th className="border px-2 md:px-3 py-2 text-center">Length</th>
                    <th className="border px-2 md:px-3 py-2">Description</th>
                    <th className="border px-2 md:px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {cycles.map((c) => {
                    const editing = editId === c.id;

                    return (
                      <tr key={c.id} className="odd:bg-white even:bg-gray-50">

                        <td className="border px-3 py-2">
                          {editing ? (
                            <Input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                            />
                          ) : (
                            c.name
                          )}
                        </td>

                        <td className="border px-3 py-2 text-center">
                          {editing ? (
                            <Input
                              type="number"
                              min={1}
                              max={28}
                              value={editForm.startDay}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  startDay: Number(e.target.value),
                                })
                              }
                            />
                          ) : (
                            c.startDay
                          )}
                        </td>

                        <td className="border px-3 py-2 text-center">
                          {editing ? (
                            <Input
                              type="number"
                              min={1}
                              max={31}
                              value={editForm.lengthDays}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  lengthDays: Number(e.target.value),
                                })
                              }
                            />
                          ) : (
                            `${c.lengthDays} days`
                          )}
                        </td>

                        <td className="border px-3 py-2">
                          {editing ? (
                            <Input
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  description: e.target.value,
                                })
                              }
                            />
                          ) : (
                            c.description || "—"
                          )}
                        </td>

                        <td className="border px-3 py-2 text-center">
                          {!editing ? (
                            <div className="flex justify-center gap-3">

                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => startEdit(c)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <AlertDialog
                                open={deleteId === c.id}
                                onOpenChange={(o) => !o && setDeleteId(null)}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => setDeleteId(c.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Cycle Timing?
                                    </AlertDialogTitle>
                                  </AlertDialogHeader>

                                  <p>Are you sure?</p>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
                                      {isDeleting ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-3">
                              <Button
                                size="icon"
                                className="bg-green-600 text-white"
                                onClick={() => saveEdit(c.id)}
                                disabled={isUpdating}
                              >
                                <Check className="h-4 w-4" />
                              </Button>

                              <Button
                                size="icon"
                                variant="outline"
                                onClick={cancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
