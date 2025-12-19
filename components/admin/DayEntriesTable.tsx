// components/admin/DayEntriesTable.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    updateAttendanceEntry,
    addManualAttendanceEntry,
    deleteAttendanceEntry,
} from "@/actions/attendance"; // these call server actions
import { getDepartments } from "@/actions/department";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, Check, X, Plus } from "lucide-react";

export default function DayEntriesTable({ entries: initialEntries, employeeId, dateKey, onDone }: any) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ time: "", scanType: "in", departmentId: "" });
    const [departments, setDepartments] = useState<any[]>([]);
    const [adding, setAdding] = useState(false);
    const [addForm, setAddForm] = useState({ time: "", scanType: "in", departmentId: "" });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [entries, setEntries] = useState<any[]>(initialEntries);

    useEffect(() => {
        (async () => {
            const res = await getDepartments();
            if (res.success) setDepartments(res.data || []);
        })();
    }, []);

    useEffect(() => {
        setEntries(initialEntries);
    }, [initialEntries]);

    // helper: build ISO timestamp for dateKey + HH:mm
    const buildISO = (day: string, hhmm: string) => {
        // assume hhmm like "09:15" — produce YYYY-MM-DDTHH:MM:00.000Z using local time
        // We'll construct as `${day}T${hhmm}:00.000Z`
        return `${day}T${hhmm}:00.000Z`;
    };

    const onStartEdit = (entry: any) => {
        const hhmm = new Date(entry.timestamp).toISOString().slice(11, 16);
        setEditingId(entry.id);
        setEditForm({ time: hhmm, scanType: entry.scanType, departmentId: entry.departmentId });
    };

    const saveEdit = async (entryId: string) => {
        try {
            if (!editForm.time || !editForm.departmentId) {
                toast.error("Time and department required");
                return;
            }
            const iso = buildISO(dateKey, editForm.time);
            const res = await updateAttendanceEntry(entryId, {
                timestamp: iso,
                scanType: editForm.scanType as "in" | "out",
                departmentId: editForm.departmentId,
            });
            if (res.success) {
                toast.success("Entry updated");
                setEditingId(null);
                // Update local state
                setEntries(prev => prev.map(e => e.id === entryId ? { ...e, timestamp: iso, scanType: editForm.scanType, departmentId: editForm.departmentId } : e));
            } else {
                toast.error(res.message || "Update failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Update failed");
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const removeEntry = (id: string) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await deleteAttendanceEntry(deleteId);
            if (res.success) {
                toast.success("Entry deleted successfully");
                // Update local state
                setEntries(prev => prev.filter(e => e.id !== deleteId));
            } else {
                toast.error(res.message || "Failed to delete entry");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete entry");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const startAdd = () => {
        setAdding(true);
        setAddForm({ time: "09:00", scanType: "in", departmentId: departments[0]?.id || "" });
    };

    const cancelAdd = () => {
        setAdding(false);
    };

    const saveAdd = async () => {
        try {
            if (!addForm.time || !addForm.departmentId) {
                toast.error("Time and department required");
                return;
            }
            const iso = buildISO(dateKey, addForm.time);
            const res = await addManualAttendanceEntry({
                employeeId,
                timestamp: iso,
                scanType: addForm.scanType as "in" | "out",
                departmentId: addForm.departmentId,
                scannedBy: "manual",
            });
            if (res.success) {
                toast.success("Entry added");
                setAdding(false);
                // Update local state
                if (res.data) {
                    setEntries(prev => [res.data, ...prev]);
                }
            } else {
                toast.error(res.message || "Add failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Add failed");
        }
    };

    return (
        <div className="space-y-2">
            {/* Add row */}
            {!adding ? (
                <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={startAdd} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add IN/OUT
                    </Button>
                </div>
            ) : (
                <div className="p-2 border rounded-md bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <Select value={addForm.scanType} onValueChange={(v: any) => setAddForm({ ...addForm, scanType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="in">IN</SelectItem>
                                <SelectItem value="out">OUT</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input type="time" value={addForm.time} onChange={(e) => setAddForm({ ...addForm, time: e.target.value })} />

                        <Select value={addForm.departmentId} onValueChange={(v: any) => setAddForm({ ...addForm, departmentId: v })}>
                            <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                            <SelectContent>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                            <Button size="sm" onClick={saveAdd}><Check /></Button>
                            <Button size="sm" variant="outline" onClick={cancelAdd}><X /></Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Entries list - Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Time</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Department</th>
                            <th className="p-2 text-left">Scanned By</th>
                            <th className="p-2 text-left">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {(() => {
                            // Sort entries by time DESC (latest first)
                            const sortedEntries = [...entries].sort(
                                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                            );

                            // Helper → Convert Date → 12-hour time
                            const formatTimeAMPM = (ts: string) => {
                                const date = new Date(ts);
                                let hours = date.getHours();
                                let minutes: any = date.getMinutes();
                                const ampm = hours >= 12 ? "PM" : "AM";

                                hours = hours % 12 || 12;
                                if (minutes < 10) minutes = "0" + minutes;

                                return `${hours}:${minutes} ${ampm}`;
                            };

                            return sortedEntries.map((e: any) => {
                                const time12 = formatTimeAMPM(e.timestamp);
                                const time24 = new Date(e.timestamp).toISOString().slice(11, 16);
                                const isEditing = editingId === e.id;

                                return (
                                    <tr key={e.id} className="odd:bg-white even:bg-gray-50">
                                        {/* TIME */}
                                        <td className="p-2">
                                            {isEditing ? (
                                                <Input
                                                    type="time"
                                                    value={editForm.time}
                                                    onChange={(ev) =>
                                                        setEditForm({ ...editForm, time: ev.target.value })
                                                    }
                                                />
                                            ) : (
                                                <span className="font-medium">{time12}</span>
                                            )}
                                        </td>

                                        {/* TYPE */}
                                        <td className="p-2">
                                            {isEditing ? (
                                                <Select
                                                    value={editForm.scanType}
                                                    onValueChange={(v: any) =>
                                                        setEditForm({ ...editForm, scanType: v })
                                                    }
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="in">IN</SelectItem>
                                                        <SelectItem value="out">OUT</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                e.scanType.toUpperCase()
                                            )}
                                        </td>

                                        {/* DEPARTMENT */}
                                        <td className="p-2">
                                            {isEditing ? (
                                                <Select
                                                    value={editForm.departmentId}
                                                    onValueChange={(v: any) =>
                                                        setEditForm({ ...editForm, departmentId: v })
                                                    }
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Dept" /></SelectTrigger>
                                                    <SelectContent>
                                                        {departments.map((d) => (
                                                            <SelectItem key={d.id} value={d.id}>
                                                                {d.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                e.department?.name || "Unknown"
                                            )}
                                        </td>

                                        {/* SCANNED BY */}
                                        <td className="p-2">
                                            {e.scannedByUser?.username || e.scannedBy || "Unknown"}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-2">
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => saveEdit(e.id)}>
                                                        <Check />
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                        <X />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => onStartEdit(e)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => removeEntry(e.id)}
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            });
                        })()}

                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-sm text-gray-500">
                                    No entries for this day
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {(() => {
                    const sortedEntries = [...entries].sort(
                        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );

                    const formatTimeAMPM = (ts: string) => {
                        const date = new Date(ts);
                        let hours = date.getHours();
                        let minutes: any = date.getMinutes();
                        const ampm = hours >= 12 ? "PM" : "AM";
                        hours = hours % 12 || 12;
                        if (minutes < 10) minutes = "0" + minutes;
                        return `${hours}:${minutes} ${ampm}`;
                    };

                    return sortedEntries.map((e: any) => {
                        const time12 = formatTimeAMPM(e.timestamp);
                        const isEditing = editingId === e.id;

                        return (
                            <div key={e.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-medium text-lg">{time12}</div>
                                        <div className="text-sm text-gray-600">{e.scanType.toUpperCase()}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <Button size="sm" onClick={() => saveEdit(e.id)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => onStartEdit(e)}>
                                                    Edit
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => removeEntry(e.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Time</label>
                                            <Input
                                                type="time"
                                                value={editForm.time}
                                                onChange={(ev) => setEditForm({ ...editForm, time: ev.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Type</label>
                                            <Select
                                                value={editForm.scanType}
                                                onValueChange={(v: any) => setEditForm({ ...editForm, scanType: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="in">IN</SelectItem>
                                                    <SelectItem value="out">OUT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Department</label>
                                            <Select
                                                value={editForm.departmentId}
                                                onValueChange={(v: any) => setEditForm({ ...editForm, departmentId: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Dept" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.map((d) => (
                                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <div className="text-sm">
                                            <span className="font-medium">Department:</span> {e.department?.name || "Unknown"}
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium">Scanned By:</span> {e.scannedByUser?.username || e.scannedBy || "Unknown"}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    });
                })()}

                {entries.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No entries for this day
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this attendance entry? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
