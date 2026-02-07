"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CheckCircle2,
  Gift,
  Percent,
  Printer,
  QrCode,
  RotateCcw,
  Star,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { CartItem, Member } from "@/lib/pos-types";
import {
  TIER_DISCOUNTS,
  POINTS_PER_BAHT,
  POINTS_REDEEM_RATE,
} from "@/lib/pos-types";
import { useToast } from "@/hooks/use-toast";
import { se } from "date-fns/locale";
import { Spinner } from "../ui/spinner";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  items: CartItem[];
  onComplete: () => void;
  selectedMember: Member | null;
}

type PaymentMethod = "cash" | "qr";

const quickCashAmounts = [20, 50, 100, 500, 1000];

const tierColors = {
  bronze: { bg: "bg-amber-100", text: "text-amber-700" },
  silver: { bg: "bg-gray-100", text: "text-gray-600" },
  gold: { bg: "bg-yellow-100", text: "text-yellow-700" },
  platinum: { bg: "bg-purple-100", text: "text-purple-700" },
};

const tierLabels = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export function PaymentModal({
  open,
  onClose,
  subtotal,
  items,
  onComplete,
  selectedMember,
}: PaymentModalProps) {
  const { addOrder, currentShift, employee } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [isPaid, setIsPaid] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate discounts
  const discountPercent = selectedMember
    ? TIER_DISCOUNTS[selectedMember.tier]
    : 0;
  const memberDiscount = Math.round(subtotal * (discountPercent / 100));
  const afterMemberDiscount = subtotal - memberDiscount;

  // Points redemption (10 points = 25 baht, minimum 10 points required)
  const maxPointsRedeem = selectedMember
    ? Math.floor(
        Math.min(
          selectedMember.points,
          Math.floor(afterMemberDiscount / POINTS_REDEEM_RATE),
        ) / 10,
      ) * 10
    : 0;
  const pointsDiscount = usePoints
    ? Math.floor(pointsToRedeem * POINTS_REDEEM_RATE)
    : 0;

  const total = afterMemberDiscount - pointsDiscount;

  // Calculate total glasses (quantity)
  const totalGlasses = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate glasses that were paid with points redemption
  // 10 points = 25 baht discount, so glasses redeemed = pointsDiscount / 25
  const glassesRedeemedWithPoints = usePoints
    ? Math.floor(pointsDiscount / 25)
    : 0;

  // Only earn points for glasses that were NOT paid with points
  const glassesEarningPoints = Math.max(
    0,
    totalGlasses - glassesRedeemedWithPoints,
  );
  const pointsEarned = glassesEarningPoints * POINTS_PER_BAHT;

  const received = Number.parseFloat(receivedAmount) || 0;
  const change = received - total;

  const handleNumberPress = (num: string) => {
    if (num === "C") {
      setReceivedAmount("");
    } else if (num === "DEL") {
      setReceivedAmount((prev) => prev.slice(0, -1));
    } else {
      setReceivedAmount((prev) => prev + num);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setReceivedAmount(amount.toString());
  };

  const handleTogglePoints = () => {
    if (!usePoints) {
      setPointsToRedeem(maxPointsRedeem);
    } else {
      setPointsToRedeem(0);
    }
    setUsePoints(!usePoints);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    if (paymentMethod === "qr" || received >= total) {
      try {
        // Prepare order data for API
        const orderData = {
          name: selectedMember?.name || null,
          phone: selectedMember?.phone || null,
          totalPrice: total,
          status: "COMPLETED",
          paymentMethod: paymentMethod,
          amountReceived: paymentMethod === "qr" ? total : received,
          change: paymentMethod === "qr" ? 0 : change,
          isPaid: true,
          memberId: selectedMember?.id || null,
          pointsEarned: pointsEarned,
          pointsUsed: usePoints ? pointsToRedeem : 0,
          discountAmount: memberDiscount + pointsDiscount,
          createdBy: employee?.id || null,
          shiftId: currentShift?.id || null,
          orderItems: items.map((item) => ({
            menuId: item.menuItem.id,
            quantity: item.quantity,
            sweetness:
              item.sweetness === "0%"
                ? "ZERO"
                : item.sweetness === "25%"
                  ? "TWENTY_FIVE"
                  : item.sweetness === "50%"
                    ? "FIFTY"
                    : item.sweetness === "75%"
                      ? "SEVENTY_FIVE"
                      : item.sweetness === "100%"
                        ? "NORMAL"
                        : "EXTRA",
            note: null,
            toppings: item.toppings.map((t) => t.id),
          })),
        };

        // Send to API
        const response = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error("Failed to create order");

        // Also add to local context for UI updates
        addOrder({
          items,
          total,
          paymentMethod,
          receivedAmount: paymentMethod === "qr" ? total : received,
          change: paymentMethod === "qr" ? 0 : change,
        });

        setIsPaid(true);
      } catch (error) {
        console.error("Error creating order:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถบันทึกออเดอร์ได้",
          variant: "destructive",
        });
      }
    }
    setIsProcessing(false);
  };

  const handlePrintReceipt = () => {
    // In real app, this would trigger receipt printing
    toast({
      title: "กำลังพิมพ์ใบเสร็จ",
      description: "กำลังดำเนินการพิมพ์ใบเสร็จ...",
    });
  };

  const handleNewOrder = () => {
    setReceivedAmount("");
    setIsPaid(false);
    setPaymentMethod("cash");
    setUsePoints(false);
    setPointsToRedeem(0);
    onComplete();
  };

  const handleClose = () => {
    setReceivedAmount("");
    setIsPaid(false);
    setPaymentMethod("cash");
    setUsePoints(false);
    setPointsToRedeem(0);
    onClose();
    if (isPaid) {
      onComplete();
    }
  };

  // Check if shift is open
  if (!currentShift) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-md p-6">
          <div className="text-center py-8">
            <h3 className="text-xl font-bold text-foreground mb-2">
              ยังไม่เปิดกะ
            </h3>
            <p className="text-muted-foreground">กรุณาเปิดกะก่อนทำการขาย</p>
            <Button onClick={handleClose} className="mt-6 bg-primary">
              ตกลง
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-border max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border bg-secondary/50">
          <DialogTitle className="text-lg font-bold text-foreground">
            ชำระเงิน
          </DialogTitle>
        </DialogHeader>

        {!isPaid ? (
          <div className="p-6">
            {/* Member Info */}
            {selectedMember && (
              <div
                className={cn(
                  "mb-4 p-4 rounded-xl",
                  tierColors[selectedMember.tier].bg,
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                    <User
                      className={cn(
                        "w-6 h-6",
                        tierColors[selectedMember.tier].text,
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {selectedMember.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full bg-white/50",
                          tierColors[selectedMember.tier].text,
                        )}
                      >
                        <Star className="w-3 h-3 inline mr-1" />
                        {tierLabels[selectedMember.tier]}
                      </span>
                      <span className="text-sm text-foreground font-medium">
                        {selectedMember.points.toLocaleString()} แต้ม
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">ส่วนลด</p>
                    <p
                      className={cn(
                        "text-lg font-bold",
                        tierColors[selectedMember.tier].text,
                      )}
                    >
                      {discountPercent}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="mb-4 p-4 bg-secondary/30 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ยอดสินค้า</span>
                <span className="text-foreground">
                  ฿{subtotal.toLocaleString()}
                </span>
              </div>
              {selectedMember && memberDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    ส่วนลดสมาชิก {discountPercent}%
                  </span>
                  <span>-฿{memberDiscount.toLocaleString()}</span>
                </div>
              )}
              {usePoints && pointsDiscount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span className="flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    ใช้แต้มแลก ({pointsToRedeem} แต้ม)
                  </span>
                  <span>-฿{pointsDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-medium text-foreground">
                  ยอดที่ต้องชำระ
                </span>
                <span className="text-2xl font-bold text-primary">
                  ฿{total.toLocaleString()}
                </span>
              </div>
              {selectedMember && (
                <div className="flex justify-between text-sm text-primary pt-1">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    แต้มที่จะได้รับ
                  </span>
                  <span>+{pointsEarned} แต้ม</span>
                </div>
              )}
            </div>

            {/* Points Redemption */}
            {selectedMember && selectedMember.points > 0 && (
              <button
                onClick={handleTogglePoints}
                disabled={selectedMember.points < 10 || maxPointsRedeem < 10}
                className={cn(
                  "w-full mb-4 p-3 rounded-xl border-2 transition-all flex items-center justify-between",
                  usePoints
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                  (selectedMember.points < 10 || maxPointsRedeem < 10) &&
                    "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      usePoints
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary",
                    )}
                  >
                    <Gift className="w-5 h-5" />
                  </div>

                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      ใช้แต้มแลกส่วนลด
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMember.points < 10 ? (
                        <span className="text-red-500">
                          ต้องมีแต้มอย่างน้อย 10 แต้ม
                        </span>
                      ) : (
                        <>
                          มีแต้ม {selectedMember.points.toLocaleString()} แต้ม
                          (แลกได้ {maxPointsRedeem} แต้ม = ฿
                          {Math.floor(maxPointsRedeem * POINTS_REDEEM_RATE)})
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    usePoints ? "border-primary bg-primary" : "border-border",
                  )}
                >
                  {usePoints && (
                    <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  )}
                </div>
              </button>
            )}

            {/* Payment Method Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                  paymentMethod === "cash"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-foreground hover:bg-accent",
                )}
              >
                <Banknote className="w-5 h-5" />
                เงินสด
              </button>
              <button
                onClick={() => setPaymentMethod("qr")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                  paymentMethod === "qr"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-foreground hover:bg-accent",
                )}
              >
                <QrCode className="w-5 h-5" />
                QR Code
              </button>
            </div>

            {paymentMethod === "cash" ? (
              <div className="space-y-4">
                {/* Received Amount Display */}
                <div className="bg-secondary/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    รับเงินมา
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    ฿{receivedAmount || "0"}
                  </p>
                </div>

                {/* Quick Amounts */}
                <div className="flex gap-2">
                  {quickCashAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      className="flex-1 py-2 rounded-lg bg-secondary text-foreground font-medium hover:bg-accent transition-colors"
                    >
                      ฿{amount}
                    </button>
                  ))}
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "C",
                    "0",
                    "DEL",
                  ].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberPress(num)}
                      className={cn(
                        "py-4 rounded-xl font-bold text-xl transition-all",
                        num === "C" || num === "DEL"
                          ? "bg-secondary text-muted-foreground hover:bg-accent"
                          : "bg-card border border-border text-primary hover:bg-secondary shadow-sm",
                      )}
                    >
                      {num === "DEL" ? (
                        <RotateCcw className="w-5 h-5 mx-auto" />
                      ) : (
                        num
                      )}
                    </button>
                  ))}
                </div>

                {/* Change Display */}
                {received > 0 && (
                  <div
                    className={cn(
                      "rounded-xl p-4 text-center",
                      change >= 0 ? "bg-green-50" : "bg-red-50",
                    )}
                  >
                    <p className="text-sm text-muted-foreground mb-1">
                      {change >= 0 ? "เงินทอน" : "ยังขาดอีก"}
                    </p>
                    <p
                      className={cn(
                        "text-3xl font-bold",
                        change >= 0 ? "text-green-600" : "text-red-500",
                      )}
                    >
                      ฿{Math.abs(change).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ) : /* QR Code Payment */
            // <div className="text-center py-6">
            //   <div className="w-48 h-48 mx-auto bg-secondary rounded-2xl flex items-center justify-center mb-4">
            //     <QrCode className="w-32 h-32 text-foreground" />
            //   </div>
            //   <p className="text-sm text-muted-foreground mb-2">
            //     สแกน QR Code เพื่อชำระเงิน
            //   </p>
            //   <p className="font-medium text-foreground">
            //     PromptPay / Mobile Banking
            //   </p>
            // </div>
            null}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmPayment}
              disabled={
                (paymentMethod === "cash" && change < 0) || isProcessing
              }
              className="w-full h-14 mt-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg disabled:opacity-50"
            >
              {isProcessing && (
                <Spinner className="w-5 h-5 mr-2 animate-spin" />
              )}
              ยืนยันการชำระเงิน
            </Button>
          </div>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              ชำระเงินสำเร็จ!
            </h3>

            {paymentMethod === "cash" && change > 0 && (
              <div className="bg-primary/10 rounded-2xl py-4 px-6 mb-4">
                <p className="text-sm text-muted-foreground mb-1">เงินทอน</p>
                <p className="text-4xl font-bold text-primary">
                  ฿{change.toLocaleString()}
                </p>
              </div>
            )}

            {selectedMember && (
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  สมาชิก: {selectedMember.name}
                </p>
                <div className="flex justify-center gap-6">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      +{pointsEarned}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      แต้มที่ได้รับ
                    </p>
                  </div>
                  {usePoints && pointsToRedeem > 0 && (
                    <div>
                      <p className="text-2xl font-bold text-red-500">
                        -{pointsToRedeem}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        แต้มที่ใช้
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handlePrintReceipt}
                variant="outline"
                className="flex-1 h-12 font-medium border-border bg-transparent"
              >
                <Printer className="w-4 h-4 mr-2" />
                พิมพ์ใบเสร็จ
              </Button>
              <Button
                onClick={handleNewOrder}
                className="flex-1 h-12 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                ออเดอร์ใหม่
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
