"use client";

import {
  Clock,
  LogOut,
  Play,
  Receipt,
  Settings,
  Square,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ShiftModal } from "./shift-modal";
import { OrderHistoryModal } from "./order-history-modal";
import Link from "next/link";

export function POSHeader() {
  const { employee, currentShift, logout, getShiftSummary } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<"open" | "close">(
    "open",
  );
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    cashSales: 0,
    qrSales: 0,
  });

  // Fetch shift summary periodically when shift is open
  useEffect(() => {
    if (currentShift) {
      // Initial fetch
      getShiftSummary().then(setSummary);

      // Update every 10 seconds
      const interval = setInterval(() => {
        getShiftSummary().then(setSummary);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [currentShift, getShiftSummary]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      setCurrentDate(
        now.toLocaleDateString("th-TH", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenShift = () => {
    setShiftModalMode("open");
    setShiftModalOpen(true);
  };

  const handleCloseShift = () => {
    setShiftModalMode("close");
    setShiftModalOpen(true);
  };

  return (
    <>
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-card border-b border-border shadow-sm gap-3 lg:gap-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-base sm:text-lg">
              B
            </span>
          </div>
          <div>
            <h1 className="font-semibold text-base sm:text-lg text-foreground">
              NAI CHA
            </h1>
            {/* <p className="text-xs text-muted-foreground">สาขา Central</p> */}
          </div>
        </div>

        {/* Mobile: Time & Date + Actions Row */}
        <div className="flex items-center justify-between w-full lg:hidden gap-2">
          {/* Time & Date */}
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="font-medium text-sm">{currentTime}</span>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {currentDate}
            </span>
          </div>

          {/* Staff Info Mobile */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {employee?.name || "ไม่ระบุ"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {employee?.role === "admin" ? "ผู้ดูแลระบบ" : "พนักงาน"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-secondary hover:bg-secondary text-primary bg-transparent h-8 px-2"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Desktop: Shift + Time + Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Shift Status */}
          {currentShift ? (
            <div className="flex items-center gap-4 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-700">
                  กะเปิดอยู่
                </span>
              </div>
              <div className="text-sm text-green-700">
                <span className="font-medium">
                  ฿{summary.totalSales.toLocaleString()}
                </span>
                <span className="text-green-600 ml-2">
                  ({summary.totalOrders} ออเดอร์)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                onClick={handleCloseShift}
              >
                <Square className="w-3 h-3 mr-1" />
                ปิดกะ
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleOpenShift}
            >
              <Play className="w-4 h-4 mr-1" />
              เปิดกะ
            </Button>
          )}

          {/* Time & Date */}
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-medium">{currentTime}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">{currentDate}</span>
          </div>

          {/* Staff & Actions */}
          <div className="flex items-center gap-4">
            {/* Order History Button */}
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-foreground hover:bg-secondary bg-transparent"
              onClick={() => setOrderHistoryOpen(true)}
            >
              <Receipt className="w-4 h-4 mr-1" />
              ออเดอร์ของฉัน
            </Button>

            {/* Admin Link */}
            {employee?.role === "admin" && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10 bg-transparent"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  แอดมิน
                </Button>
              </Link>
            )}

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {employee?.name || "ไม่ระบุ"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {employee?.role === "admin" ? "ผู้ดูแลระบบ" : "พนักงาน"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-secondary hover:bg-secondary text-primary bg-transparent"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-1" />
              ออก
            </Button>
          </div>
        </div>

        {/* Mobile: Shift Status + Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full lg:hidden gap-2">
          {/* Shift Status Mobile */}
          {currentShift ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-green-50 px-3 py-2 rounded-lg border border-green-200 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-green-700">
                  กะเปิด
                </span>
              </div>
              <div className="text-xs sm:text-sm text-green-700">
                <span className="font-medium">
                  ฿{summary.totalSales.toLocaleString()}
                </span>
                <span className="text-green-600 ml-1 sm:ml-2">
                  ({summary.totalOrders})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent h-7 px-2 ml-auto"
                onClick={handleCloseShift}
              >
                <Square className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">ปิดกะ</span>
              </Button>
            </div>
          ) : (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white h-9 flex-1"
              onClick={handleOpenShift}
            >
              <Play className="w-4 h-4 mr-1" />
              เปิดกะ
            </Button>
          )}

          {/* Action Buttons Mobile */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-foreground hover:bg-secondary bg-transparent h-9 px-2 sm:px-3 flex-1 sm:flex-initial"
              onClick={() => setOrderHistoryOpen(true)}
            >
              <Receipt className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">ออเดอร์</span>
            </Button>

            {employee?.role === "admin" && (
              <Link href="/admin" className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10 bg-transparent h-9 px-2 sm:px-3 w-full"
                >
                  <Settings className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">แอดมิน</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <ShiftModal
        open={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        mode={shiftModalMode}
      />

      <OrderHistoryModal
        open={orderHistoryOpen}
        onClose={() => setOrderHistoryOpen(false)}
      />
    </>
  );
}
