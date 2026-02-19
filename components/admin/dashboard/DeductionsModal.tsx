"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, IndianRupee } from "lucide-react";

interface DeductionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDeductions: Record<string, number>;
    onSave: (deductions: Record<string, number>) => void;
}

export function DeductionsModal({
    isOpen,
    onClose,
    initialDeductions,
    onSave,
}: DeductionsModalProps) {
    const [items, setItems] = useState<{ key: string; value: number }[]>([]);

    useEffect(() => {
        if (isOpen) {
            const formatted = Object.entries(initialDeductions || {}).map(([k, v]) => ({
                key: k,
                value: Number(v),
            }));
            setItems(formatted.length > 0 ? formatted : [{ key: "", value: 0 }]);
        }
    }, [isOpen, initialDeductions]);

    const addItem = () => {
        setItems([...items, { key: "", value: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: "key" | "value", val: any) => {
        const newItems = [...items];
        if (field === "value") {
            newItems[index][field] = Number(val);
        } else {
            newItems[index][field] = val;
        }
        setItems(newItems);
    };

    const handleSave = () => {
        const result: Record<string, number> = {};
        items.forEach((item) => {
            if (item.key.trim()) {
                result[item.key.trim()] = item.value;
            }
        });
        onSave(result);
    };

    const total = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-blue-600" />
                        Manage Deductions
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto pr-2">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-end gap-3 animate-in fade-in slide-in-from-top-1">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Label</Label>
                                <Input
                                    placeholder="e.g. Shoes"
                                    value={item.key}
                                    onChange={(e) => updateItem(index, "key", e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="w-24 space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Amount</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={item.value}
                                    onChange={(e) => updateItem(index, "value", e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="h-9 w-9 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addItem}
                        className="w-full border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 text-slate-500 font-medium"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deduction Row
                    </Button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">Total Deductions</span>
                    <span className="text-lg font-bold text-blue-600">₹{total}</span>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                        Save Adjustments
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
