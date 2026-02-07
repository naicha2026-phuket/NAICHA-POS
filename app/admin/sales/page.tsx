"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  TrendingUp,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

interface MenuSalesData {
  menuId: string;
  menuName: string;
  categoryName: string;
  count: number;
  revenue: number;
}

interface PaymentSummary {
  method: string;
  amount: number;
  percentage: number;
  color: string;
}

interface ShiftSummary {
  shiftId: string;
  shiftTime: string;
  employee: string;
  sales: number;
  orders: number;
}

interface SalesReportData {
  summary: {
    totalSales: number;
    totalOrders: number;
    avgPerOrder: number;
    totalGlasses: number;
  };
  dailySales: Array<{
    day: string;
    sales: number;
    orders: number;
  }>;
  hourlySales: Array<{
    hour: string;
    sales: number;
  }>;
  paymentSummary: PaymentSummary[];
  shiftSummary: ShiftSummary[];
  bestSellers: MenuSalesData[];
  categories: Array<{ name: string; value: number; count: number }>;
}

export default function SalesReport() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("week");
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reports/sales?period=${period}`);

      if (!response.ok) throw new Error("Failed to fetch report data");
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรายงานยอดขายได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalSales = reportData?.summary.totalSales || 0;
  const totalOrders = reportData?.summary.totalOrders || 0;
  const avgPerOrder = reportData?.summary.avgPerOrder || 0;
  const totalGlasses = reportData?.summary.totalGlasses || 0;
  const dailySalesData = reportData?.dailySales || [];
  const hourlySalesData = reportData?.hourlySales || [];
  const paymentSummary = reportData?.paymentSummary || [];
  const shiftSummary = reportData?.shiftSummary || [];

  // ใช้ข้อมูลหมวดหมู่จาก API โดยตรง (ครอบคลุมทุกเมนู ไม่ใช่แค่ top 10)
  const categorySalesData = reportData?.categories || [];

  // สีที่ชัดเจนสำหรับแต่ละหมวดหมู่
  const CATEGORY_COLORS = [
    "#EC407A", // Pink
    "#AB47BC", // Purple
    "#5C6BC0", // Indigo
    "#42A5F5", // Blue
    "#26A69A", // Teal
    "#66BB6A", // Green
    "#FFCA28", // Amber
    "#FF7043", // Deep Orange
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">รายงานยอดขาย</h1>
          <p className="text-muted-foreground">สรุปยอดขายและวิเคราะห์ข้อมูล</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">วันนี้</SelectItem>
              <SelectItem value="week">สัปดาห์นี้</SelectItem>
              <SelectItem value="month">เดือนนี้</SelectItem>
              <SelectItem value="year">ปีนี้</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <BarChart3 className="w-8 h-8 text-muted-foreground animate-pulse" />
          <p className="ml-3 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
                  <p className="text-2xl font-bold text-foreground">
                    ฿{totalSales.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">จำนวนออเดอร์</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalOrders}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-light flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">จำนวนแก้ว</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalGlasses}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    เฉลี่ย/ออเดอร์
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ฿{avgPerOrder.toFixed(0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Best Selling Menu Items */}
          <Card className="p-6 border-border mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              เมนูขายดี
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {reportData?.bestSellers.slice(0, 10).map((item) => (
                <Card
                  key={item.menuId}
                  className="p-4 border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Coffee className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {item.menuName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {item.categoryName}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        ขายได้
                      </span>
                      <span className="font-bold text-primary">
                        {item.count} แก้ว
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        รายได้
                      </span>
                      <span className="font-semibold text-green-600">
                        ฿{item.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {(!reportData?.bestSellers ||
              reportData.bestSellers.length === 0) && (
              <div className="text-center py-8">
                <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">ยังไม่มีข้อมูลการขาย</p>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Sales Chart */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                ยอดขายรายวัน
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F8BBD0" />
                    <XAxis dataKey="day" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #F8BBD0",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        `฿${value.toLocaleString()}`,
                        "ยอดขาย",
                      ]}
                    />
                    <Bar dataKey="sales" fill="#EC407A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Hourly Sales Chart */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                ยอดขายรายชั่วโมง
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlySalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F8BBD0" />
                    <XAxis dataKey="hour" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #F8BBD0",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        `฿${value.toLocaleString()}`,
                        "ยอดขาย",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#EC407A"
                      strokeWidth={3}
                      dot={{ fill: "#EC407A", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Category Sales Donut Chart */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                แยกตามหมวดหมู่
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySalesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={true}
                    >
                      {categorySalesData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `฿${value.toLocaleString()}`,
                        "ยอดขาย",
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry: any) => {
                        const data = categorySalesData.find(
                          (d) => d.name === value,
                        );
                        return `${value} (${data?.count || 0} แก้ว)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                แยกตามช่องทางชำระเงิน
              </h2>
              <div className="space-y-4">
                {paymentSummary.map((item) => (
                  <div key={item.method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {item.method}
                      </span>
                      <span className="text-muted-foreground">
                        ฿{item.amount.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Shift Summary */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                สรุปตามกะ
              </h2>
              {shiftSummary.length > 0 ? (
                <div className="space-y-4">
                  {shiftSummary.map((item) => (
                    <div
                      key={item.shiftId}
                      className="p-4 bg-secondary/50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">
                          กะเวลา {item.shiftTime}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.employee}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          ฿{item.sales.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.orders} ออเดอร์
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">ยังไม่มีข้อมูลกะ</p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
