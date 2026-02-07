"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Hash,
  Receipt,
  Search,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface OrderHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

interface DbOrder {
  id: string;
  name: string | null;
  phone: string | null;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  amountReceived: number | null;
  change: number | null;
  isPaid: boolean;
  createdAt: string;
  discountAmount: number;
  shiftId: string | null;
  orderItems: Array<{
    id: string;
    quantity: number;
    sweetness: string;
    note: string | null;
    menu: {
      id: string;
      name: string;
      price: number;
      category: {
        name: string;
      };
    };
    toppings: Array<{
      id: string;
      name: string;
      price: number;
    }>;
  }>;
  member: {
    id: string;
    name: string | null;
    phone: string;
    points: number;
  } | null;
}

const statusConfig = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  COMPLETED: {
    label: "สำเร็จ",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  PROCESSING: {
    label: "กำลังดำเนินการ",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

export function OrderHistoryModal({ open, onClose }: OrderHistoryModalProps) {
  const { currentShift, employee } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchOrders();
    }
  }, [open, currentShift]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/order?date=${today}`);

      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();

      // Handle both array response and { orders: [] } format
      const orderData = Array.isArray(data) ? data : data.orders || [];
      console.log("Fetched orders:", orderData);

      setOrders(
        orderData.filter(
          (order: DbOrder) => order.shiftId === currentShift?.id,
        ),
      );
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const filteredOrders = useMemo(() => {
    return orders
      ?.filter((order) => {
        const matchSearch =
          search === "" ||
          order.id.includes(search) ||
          order.name?.toLowerCase().includes(search.toLowerCase()) ||
          order.member?.name?.toLowerCase().includes(search.toLowerCase()) ||
          order.orderItems.some((item) =>
            item.menu.name.toLowerCase().includes(search.toLowerCase()),
          );
        const matchStatus =
          statusFilter === "all" || order.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders, search, statusFilter]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Stats
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === new Date().toDateString(),
  );
  const todaySales = todayOrders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.totalPrice, 0);
  const completedCount = todayOrders.filter(
    (o) => o.status === "COMPLETED",
  ).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  ประวัติออเดอร์ของฉัน
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {employee?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-pink-soft rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {todayOrders.length}
              </p>
              <p className="text-xs text-muted-foreground">ออเดอร์วันนี้</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {completedCount}
              </p>
              <p className="text-xs text-muted-foreground">สำเร็จ</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">
                ฿{todaySales.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">ยอดขายวันนี้</p>
            </div>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="p-4 border-b border-border bg-muted/30 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเลขออเดอร์ เมนู หรือชื่อสมาชิก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {["all", "COMPLETED", "CANCELLED", "PENDING"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "text-xs",
                  statusFilter !== status && "bg-transparent",
                )}
              >
                {status === "all"
                  ? "ทั้งหมด"
                  : statusConfig[status as keyof typeof statusConfig].label}
              </Button>
            ))}
          </div>
        </div>

        {/* Order List */}
        <ScrollArea className="flex-1 h-[400px]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
                <p className="text-muted-foreground">กำลังโหลด...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">ไม่พบออเดอร์</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedOrder === order.id}
                  onToggle={() => toggleExpand(order.id)}
                  formatTime={formatTime}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface OrderCardProps {
  order: DbOrder;
  expanded: boolean;
  onToggle: () => void;
  formatTime: (date: string) => string;
  formatDate: (date: string) => string;
}

function OrderCard({
  order,
  expanded,
  onToggle,
  formatTime,
  formatDate,
}: OrderCardProps) {
  const status = statusConfig[order.status as keyof typeof statusConfig];
  const itemCount = order.orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden transition-all duration-200",
        expanded
          ? "border-primary shadow-md"
          : "border-border hover:border-primary/30",
      )}
    >
      {/* Header */}
      <button
        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">#{order.id.slice(0, 8)}</span>
              <Badge
                variant="outline"
                className={cn("text-xs", status?.color || "")}
              >
                {status?.label || order.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(order.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(order.createdAt)}
              </span>
              <span>{itemCount} รายการ</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-lg text-primary">
              ฿{order.totalPrice.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              {order.paymentMethod === "CASH" ? (
                <>
                  <Wallet className="w-3 h-3" /> เงินสด
                </>
              ) : (
                <>
                  <CreditCard className="w-3 h-3" /> QR Code
                </>
              )}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          {/* Member Info */}
          {order.member && (
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {order.member.name || order.member.phone}
              </span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {order.member.points} แต้ม
              </Badge>
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              รายการสินค้า
            </p>
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-card rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {item.menu.name}{" "}
                    <span className="text-muted-foreground">
                      x{item.quantity}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.menu.category.name} | {item.sweetness}
                    {item.toppings.length > 0 &&
                      ` | ${item.toppings.map((t) => t.name).join(", ")}`}
                  </p>
                </div>
                <p className="font-medium">
                  ฿
                  {(
                    (item.menu.price +
                      item.toppings.reduce((sum, t) => sum + t.price, 0)) *
                    item.quantity
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-border pt-3 space-y-1 text-sm">
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>ส่วนลด</span>
                <span>-฿{order.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed">
              <span>ยอดสุทธิ</span>
              <span className="text-primary">
                ฿{order.totalPrice.toLocaleString()}
              </span>
            </div>
            {order.paymentMethod === "CASH" && order.amountReceived && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>รับเงิน</span>
                  <span>฿{order.amountReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>เงินทอน</span>
                  <span>฿{(order.change || 0).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
