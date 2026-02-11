"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowDownToLine,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Filter,
  Hash,
  Receipt,
  RefreshCcw,
  Search,
  User,
  Wallet,
  X,
  XCircle,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  name: string | null;
  phone: string | null;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  amountReceived: number;
  change: number;
  pointsEarned: number;
  pointsUsed: number;
  discountAmount: number;
  createdAt: string;
  member: {
    id: string;
    name: string;
    phone: string;
    tier: string;
  } | null;
  staff: {
    id: string;
    name: string;
  } | null;
  shift: {
    id: string;
    openedAt: string;
  } | null;
  orderItems: Array<{
    id: string;
    quantity: number;
    sweetness: string;
    note: string | null;
    menu: {
      id: string;
      name: string;
      price: number;
    };
    toppings: Array<{
      id: string;
      name: string;
      price: number;
    }>;
  }>;
}

const statusConfig = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  COMPLETED: {
    label: "สำเร็จ",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Check,
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [dateFilter]);

  useEffect(() => {
    applyFilters();
  }, [orders, search, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/order?period=${dateFilter}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลออเดอร์ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.status === statusFilter.toUpperCase(),
      );
    }

    // Search by menu name or member name
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter((order) => {
        const memberMatch = order.member?.name.toLowerCase().includes(query);
        const menuMatch = order.orderItems?.some((item) =>
          item.menu.name.toLowerCase().includes(query),
        );
        const phoneMatch =
          order.member?.phone.includes(query) || order.phone?.includes(query);
        return memberMatch || menuMatch || phoneMatch;
      });
    }

    setFilteredOrders(filtered);
  };

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Action dialogs
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "cancel" | "refund" | null;
    orderId: string | null;
  }>({ open: false, type: null, orderId: null });
  const [actionNote, setActionNote] = useState("");

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const exportToExcel = () => {
    try {
      // Prepare table data
      const headers = [
        "เลขที่ออเดอร์",
        "วันที่",
        "เวลา",
        "สมาชิก",
        "เบอร์โทร",
        "รายการ",
        "จำนวน",
        "ยอดรวม",
        "ส่วนลด",
        "ยอดสุทธิ",
        "ช่องทางชำระ",
        "สถานะ",
        "พนักงาน",
      ];

      const rows = filteredOrders.map((order) => {
        const itemsList = order.orderItems
          .map((item) => `${item.menu.name} (${item.quantity})`)
          .join("; ");
        const totalItems = order.orderItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        return [
          order.id.substring(0, 8),
          formatDate(order.createdAt),
          formatTime(order.createdAt),
          order.member?.name || "-",
          order.member?.phone || order.phone || "-",
          itemsList,
          totalItems,
          order.totalPrice + order.discountAmount,
          order.discountAmount,
          order.totalPrice,
          order.paymentMethod === "CASH" ? "เงินสด" : "โอนเงิน",
          statusConfig[order.status as keyof typeof statusConfig]?.label ||
            order.status,
          order.staff?.name || "-",
        ];
      });

      // Create HTML table for Excel
      let tableHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Orders</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table { border-collapse: collapse; width: 100%; }
            th { background-color: #4472C4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ccc; }
            td { padding: 8px; border: 1px solid #ccc; }
            .number { mso-number-format: "\\#\\,\\#\\#0"; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map((h) => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) =>
                    `<tr>
                  ${row
                    .map((cell, idx) => {
                      // Format number columns
                      if (idx >= 6 && idx <= 9) {
                        return `<td class="number">${cell}</td>`;
                      }
                      return `<td>${cell}</td>`;
                    })
                    .join("")}
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Add BOM for Thai characters
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + tableHTML], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });

      // Create download link
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `orders-${new Date().toISOString().split("T")[0]}.xls`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "สำเร็จ",
        description: `ส่งออกข้อมูล ${filteredOrders.length} รายการเรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleAction = (type: "cancel" | "refund", orderId: string) => {
    setActionDialog({ open: true, type, orderId });
    setActionNote("");
  };

  const confirmAction = async () => {
    if (!actionDialog.orderId || !actionDialog.type) return;

    try {
      const response = await fetch("/api/order", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: actionDialog.orderId,
          status: actionDialog.type === "cancel" ? "CANCELLED" : "CANCELLED",
          note: actionNote,
        }),
      });

      if (!response.ok) throw new Error("Failed to update order");

      toast({
        title: "สำเร็จ",
        description:
          actionDialog.type === "cancel"
            ? "ยกเลิกออเดอร์เรียบร้อยแล้ว"
            : "คืนเงินเรียบร้อยแล้ว",
      });

      // Refresh orders list
      await fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตออเดอร์ได้",
        variant: "destructive",
      });
    } finally {
      setActionDialog({ open: false, type: null, orderId: null });
      setActionNote("");
    }
  };

  // Calculate stats
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + order.totalPrice,
    0,
  );
  const completedCount = filteredOrders.filter(
    (o) => o.status === "COMPLETED",
  ).length;
  const pendingCount = filteredOrders.filter(
    (o) => o.status === "PENDING",
  ).length;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            จัดการออเดอร์
          </h1>
          <p className="text-sm text-muted-foreground">
            ดูและจัดการออเดอร์ทั้งหมดในระบบ
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-transparent w-full sm:w-auto"
          onClick={exportToExcel}
        >
          <ArrowDownToLine className="w-4 h-4 mr-2" />
          ส่งออก Excel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  ออเดอร์ทั้งหมด
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {totalOrders}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  ยอดขายรวม
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">
                  ฿{totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  สำเร็จ
                </p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {completedCount}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  รอดำเนินการ
                </p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            ตัวกรอง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="flex-1 min-w-full sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหา..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="PENDING">รอดำเนินการ</SelectItem>
                <SelectItem value="COMPLETED">สำเร็จ</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="ช่วงเวลา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">วันนี้</SelectItem>
                <SelectItem value="yesterday">เมื่อวาน</SelectItem>
                <SelectItem value="week">7 วัน</SelectItem>
                <SelectItem value="month">30 วัน</SelectItem>
                <SelectItem value="all">ทั้งหมด</SelectItem>
              </SelectContent>
            </Select>
            {(statusFilter !== "all" ||
              dateFilter !== "today" ||
              search !== "") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDateFilter("today");
                }}
              >
                <X className="w-4 h-4 mr-1" />
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              รายการออเดอร์ ({filteredOrders.length})
            </CardTitle>
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">
                  กำลังโหลด...
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg animate-pulse"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                ไม่พบออเดอร์ที่ตรงกับเงื่อนไข
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  expanded={expandedOrder === order.id}
                  onToggle={() => toggleExpand(order.id)}
                  onCancel={() => handleAction("cancel", order.id)}
                  onRefund={() => handleAction("refund", order.id)}
                  formatTime={formatTime}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, type: null, orderId: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "cancel"
                ? "ยกเลิกออเดอร์"
                : "คืนเงินออเดอร์"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "cancel"
                ? "กรุณาระบุเหตุผลในการยกเลิกออเดอร์นี้"
                : "กรุณาระบุเหตุผลในการคืนเงินออเดอร์นี้"}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="ระบุเหตุผล..."
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, type: null, orderId: null })
              }
              className="bg-transparent"
            >
              ยกเลิก
            </Button>
            <Button
              variant={
                actionDialog.type === "cancel" ? "destructive" : "default"
              }
              onClick={confirmAction}
            >
              {actionDialog.type === "cancel"
                ? "ยืนยันยกเลิก"
                : "ยืนยันคืนเงิน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface OrderRowProps {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRefund: () => void;
  formatTime: (date: Date) => string;
  formatDate: (date: Date) => string;
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onCancel,
  onRefund,
  formatTime,
  formatDate,
}: OrderRowProps) {
  const status = statusConfig[order.status as keyof typeof statusConfig];
  const StatusIcon = status?.icon || Clock;
  const itemCount =
    order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className={cn(expanded && "bg-muted/20")}>
      {/* Row Header */}
      <div className="p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-4">
        <button
          className="flex-1 flex items-start sm:items-center gap-3 sm:gap-4 text-left min-w-0"
          onClick={onToggle}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base">
                #{order.id.substring(0, 8)}
              </span>
              <Badge variant="outline" className={cn("text-xs", status.color)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              {order.member && (
                <Badge variant="secondary" className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  {order.member.name}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(order.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(order.createdAt)}
              </span>
              <span className="flex items-center gap-1 hidden sm:flex">
                <User className="w-3 h-3" />
                {order.staff?.name || "-"}
              </span>
              <span>{itemCount} รายการ</span>
            </div>
          </div>
        </button>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
          <div className="text-right">
            <p className="font-bold text-base sm:text-lg whitespace-nowrap">
              ฿{order.totalPrice.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              {order.paymentMethod === "CASH" ? (
                <>
                  <Wallet className="w-3 h-3" />{" "}
                  <span className="hidden sm:inline">เงินสด</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3 h-3" />{" "}
                  <span className="hidden sm:inline">โอนเงิน</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Actions */}
            {order.status === "COMPLETED" && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent h-8 px-2 sm:px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
              >
                <span className="hidden sm:inline">ยกเลิก</span>
                <X className="w-4 h-4 sm:hidden" />
              </Button>
            )}

            <button onClick={onToggle} className="p-2">
              {expanded ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-border sm:ml-14 space-y-3 sm:space-y-4">
          {/* Items */}
          <div className="space-y-2 pt-3 sm:pt-4">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              รายการสินค้า
            </p>
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-card rounded-lg border border-border gap-1 sm:gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base">
                    {item.menu.name}{" "}
                    <span className="text-muted-foreground">
                      x{item.quantity}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground break-words">
                    ความหวาน {item.sweetness}
                    {item.toppings.length > 0 &&
                      ` | ${item.toppings.map((t) => t.name).join(", ")}`}
                    {item.note && ` | หมายเหตุ: ${item.note}`}
                  </p>
                </div>
                <p className="font-medium text-sm sm:text-base whitespace-nowrap self-end sm:self-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ยอดรวม</span>
                <span>
                  ฿{(order.totalPrice + order.discountAmount).toLocaleString()}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>ส่วนลด</span>
                  <span>-฿{order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              {order.pointsUsed > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>ใช้แต้มแลก ({order.pointsUsed} แต้ม)</span>
                  <span>-฿{(order.pointsUsed * 2.5).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t border-dashed">
                <span>ยอดสุทธิ</span>
                <span className="text-primary">
                  ฿{order.totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              {order.paymentMethod === "CASH" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">รับเงิน</span>
                    <span>฿{order.amountReceived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เงินทอน</span>
                    <span>฿{order.change.toLocaleString()}</span>
                  </div>
                </>
              )}
              {order.pointsEarned > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>แต้มที่ได้รับ</span>
                  <span>+{order.pointsEarned} แต้ม</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
