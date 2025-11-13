"use client";

import { useEffect, useState } from "react";
import {
    getDepartments,
    updateDepartment,
    deleteDepartment,
    createDepartment,
} from "@/actions/department";

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

export default function DepartmentsPage() {
    const router = useRouter();

    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [editRowId, setEditRowId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: "", description: "" });

    const [newDept, setNewDept] = useState({ name: "", description: "" });

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string>("");

    // Load Departments
    const loadDepartments = async () => {
        setLoading(true);
        const res = await getDepartments();
        if (res.success) setDepartments(res.data || []);
        else toast.error("Failed to load departments");
        setLoading(false);
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    // Create
    const handleCreate = async (e: any) => {
        e.preventDefault();
        const res = await createDepartment(newDept);

        if (res.success) {
            toast.success("Department created");
            setNewDept({ name: "", description: "" });
            loadDepartments();
        } else toast.error(res.message);
    };

    // Start Editing
    const handleStartEdit = (dept: any) => {
        setEditRowId(dept.id);
        setEditForm({
            name: dept.name,
            description: dept.description || "",
        });
    };

    // Save Edit
    const handleSave = async (id: string) => {
        const res = await updateDepartment(id, editForm);

        if (res.success) {
            toast.success("Updated successfully");
            setEditRowId(null);
            setEditForm({ name: "", description: "" });
            loadDepartments();
        } else toast.error(res.message);
    };

    // Cancel edit
    const handleCancel = () => {
        setEditRowId(null);
        setEditForm({ name: "", description: "" });
    };

    // Confirm delete
    const handleDeleteConfirmed = async () => {
        if (!deleteId) return;

        const res = await deleteDepartment(deleteId);

        if (res.success) {
            toast.success("Department deleted");
            setDeleteError("");
            setDeleteId(null);
            loadDepartments();
        } else {
            setDeleteError(res.message); // show error inside modal
        }
    };

    return (
        <div className="p-6 space-y-6">

            {/* BACK BUTTON */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/dashboard")}
                className="flex items-center gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Button>

            <h1 className="text-2xl font-bold">Department Management</h1>

            {/* ADD NEW DEPARTMENT */}
            <Card className="md:max-w-lg">
                <CardHeader>
                    <CardTitle>Add Department</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Input
                            placeholder="Department Name"
                            required
                            value={newDept.name}
                            onChange={(e) =>
                                setNewDept({ ...newDept, name: e.target.value })
                            }
                        />
                        <Input
                            placeholder="Description"
                            value={newDept.description}
                            onChange={(e) =>
                                setNewDept({ ...newDept, description: e.target.value })
                            }
                        />

                        <Button type="submit" className="w-full">
                            Add Department
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* TABLE */}
            <Card>
                <CardHeader>
                    <CardTitle>All Departments</CardTitle>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <p>Loading…</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border px-3 py-2 text-left">Name</th>
                                        <th className="border px-3 py-2 text-left">Description</th>
                                        <th className="border px-3 py-2 text-center">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {departments.map((dept) => {
                                        const editing = editRowId === dept.id;

                                        return (
                                            <tr key={dept.id} className="odd:bg-white even:bg-gray-50">

                                                {/* Name */}
                                                <td className="border px-3 py-2">
                                                    {editing ? (
                                                        <Input
                                                            value={editForm.name}
                                                            onChange={(e) =>
                                                                setEditForm({
                                                                    ...editForm,
                                                                    name: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    ) : (
                                                        dept.name
                                                    )}
                                                </td>

                                                {/* Description */}
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
                                                        dept.description || "—"
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="border px-3 py-2 text-center">
                                                    {!editing ? (
                                                        <div className="flex justify-center gap-3">

                                                            {/* Edit */}
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => handleStartEdit(dept)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>

                                                            {/* Delete Modal */}
                                                            <AlertDialog
                                                                open={deleteId === dept.id}
                                                                onOpenChange={(open) => {
                                                                    if (!open) {
                                                                        setDeleteId(null);
                                                                        setDeleteError("");
                                                                    }
                                                                }}
                                                            >
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            setDeleteId(dept.id)
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>

                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>
                                                                            Delete Department?
                                                                        </AlertDialogTitle>
                                                                    </AlertDialogHeader>

                                                                    {deleteError ? (
                                                                        <p className="text-red-600 font-medium">
                                                                            {deleteError}
                                                                        </p>
                                                                    ) : (
                                                                        <p>
                                                                            Are you sure you want to delete this
                                                                            department?
                                                                        </p>
                                                                    )}

                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>
                                                                            Cancel
                                                                        </AlertDialogCancel>

                                                                        <AlertDialogAction
                                                                            onClick={handleDeleteConfirmed}
                                                                        >
                                                                            Delete
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
                                                                onClick={() => handleSave(dept.id)}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>

                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                onClick={handleCancel}
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
