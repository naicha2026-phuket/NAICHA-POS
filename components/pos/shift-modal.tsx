"use client";

import { useState, useEffect } from "react";
import { Clock, DollarSign, Play, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

interface ShiftModalProps {
  open: boolean;
  onClose: () => void;
  mode: "open" | "close";
}

export function ShiftModal({ open, onClose, mode }: ShiftModalProps) {
  const { openShift, closeShift, currentShift, getShiftSummary } = useAuth();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    cashSales: 0,
    qrSales: 0,
  });

  // Fetch shift summary when modal opens for closing
  useEffect(() => {
    if (open && mode === "close") {
      getShiftSummary().then(setSummary);
    }
  }, [open, mode, getShiftSummary]);

  // Calculate if there's a difference
  const expectedCash = currentShift
    ? currentShift.startingCash + summary.cashSales
    : 0;
  const actualCash = parseFloat(amount) || 0;
  const hasDifference =
    mode === "close" && amount && actualCash !== expectedCash;

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount) || 0;

    // Validate note requirement for difference
    if (hasDifference && !note.trim()) {
      setError("กรุณาระบุหมายเหตุเมื่อมีส่วนต่างของเงิน");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "open") {
        await openShift(numAmount);
      } else {
        await closeShift(numAmount, note.trim() || undefined);
      }

      setAmount("");
      setNote("");
      onClose();
      // Force refresh summary after closing
      if (mode === "close") {
        await getShiftSummary();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (num: number) => {
    return num.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {mode === "open" ? (
              <>
                <Play className="w-5 h-5 text-green-600" />
                เปิดกะ
              </>
            ) : (
              <>
                <Square className="w-5 h-5 text-destructive" />
                ปิดกะ
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {mode === "close" && currentShift && (
            <>
              {/* Shift Summary */}
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    เริ่มกะ: {formatTime(new Date(currentShift.startTime))}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
                    <p className="text-xl font-bold text-primary">
                      ฿{formatCurrency(summary.totalSales)}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      จำนวนออเดอร์
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {summary.totalOrders}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">เงินสด</p>
                    <p className="text-lg font-semibold text-green-600">
                      ฿{formatCurrency(summary.cashSales)}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">QR Code</p>
                    <p className="text-lg font-semibold text-blue-600">
                      ฿{formatCurrency(summary.qrSales)}
                    </p>
                  </div>
                </div>

                <div className="bg-card rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">เงินเปิดกะ</p>
                  <p className="text-lg font-semibold">
                    ฿{formatCurrency(currentShift.startingCash)}
                  </p>
                </div>

                <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    ควรมีเงินในลิ้นชัก
                  </p>
                  <p className="text-xl font-bold text-primary">
                    ฿
                    {formatCurrency(
                      currentShift.startingCash + summary.cashSales,
                    )}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-medium">
              <DollarSign className="w-4 h-4 inline mr-1" />
              {mode === "open" ? "เงินเปิดกะ" : "เงินปิดกะ (นับจริง)"}
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 text-xl text-center font-semibold"
            />
          </div>

          {mode === "close" && currentShift && amount && (
            <div
              className={`p-3 rounded-lg ${
                parseFloat(amount) ===
                currentShift.startingCash + summary.cashSales
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              <p className="text-sm font-medium text-center">
                {parseFloat(amount) ===
                currentShift.startingCash + summary.cashSales
                  ? "ยอดตรงกัน"
                  : `ส่วนต่าง: ฿${formatCurrency(
                      parseFloat(amount) -
                        (currentShift.startingCash + summary.cashSales),
                    )}`}
              </p>
            </div>
          )}

          {/* Note field - required when there's difference */}
          {mode === "close" && hasDifference && (
            <div className="space-y-2">
              <Label
                htmlFor="note"
                className="text-base font-medium text-destructive"
              >
                หมายเหตุ (บังคับ) *
              </Label>
              <Input
                id="note"
                placeholder="ระบุเหตุผลที่มีส่วนต่างของเงิน..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-800">
              <p className="text-sm font-medium text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 bg-transparent"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            ยกเลิก
          </Button>
          <Button
            className={`flex-1 h-12 ${
              mode === "open"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-destructive hover:bg-destructive/90"
            }`}
            onClick={handleSubmit}
            disabled={loading || !amount}
          >
            {loading ? (
              "กำลังดำเนินการ..."
            ) : mode === "open" ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                เปิดกะ
              </>
            ) : (
              <>
                <Square className="w-4 h-4 mr-2" />
                ปิดกะ
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
