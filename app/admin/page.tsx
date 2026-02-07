"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Coffee,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface DashboardData {
  stats: {
    todaySales: {
      value: number;
      change: number;
      positive: boolean;
    };
    orderCount: {
      value: number;
      change: number;
      positive: boolean;
    };
    glassesCount: {
      value: number;
      change: number;
      positive: boolean;
    };
    menuCount: {
      value: number;
      change: number;
      positive: boolean;
    };
    staffCount: {
      value: number;
      change: number;
      positive: boolean;
    };
  };
  recentOrders: Array<{
    id: string;
    time: string;
    items: string;
    total: number;
    status: string;
  }>;
  topSelling: Array<{
    name: string;
    sales: number;
    percentage: number;
  }>;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = dashboardData
    ? [
        {
          label: "ยอดขายวันนี้",
          value: `฿${dashboardData.stats.todaySales.value.toLocaleString()}`,
          change: `${dashboardData.stats.todaySales.change >= 0 ? "+" : ""}${dashboardData.stats.todaySales.change}%`,
          positive: dashboardData.stats.todaySales.positive,
          icon: DollarSign,
          color: "bg-green-100 text-green-600",
        },
        {
          label: "จำนวนออเดอร์",
          value: dashboardData.stats.orderCount.value.toString(),
          change: `${dashboardData.stats.orderCount.change >= 0 ? "+" : ""}${dashboardData.stats.orderCount.change}%`,
          positive: dashboardData.stats.orderCount.positive,
          icon: ShoppingCart,
          color: "bg-blue-100 text-blue-600",
        },
        {
          label: "จำนวนแก้ว",
          value: dashboardData.stats.glassesCount.value.toString(),
          change: `${dashboardData.stats.glassesCount.change >= 0 ? "+" : ""}${dashboardData.stats.glassesCount.change}%`,
          positive: dashboardData.stats.glassesCount.positive,
          icon: Coffee,
          color: "bg-pink-light text-primary",
        },
        {
          label: "เมนูทั้งหมด",
          value: dashboardData.stats.menuCount.value.toString(),
          change: "0",
          positive: true,
          icon: Coffee,
          color: "bg-orange-100 text-orange-600",
        },
        {
          label: "พนักงาน",
          value: dashboardData.stats.staffCount.value.toString(),
          change: "0",
          positive: true,
          icon: Users,
          color: "bg-purple-100 text-purple-600",
        },
      ]
    : [];

  const recentOrders = dashboardData?.recentOrders || [];
  const topSelling = dashboardData?.topSelling || [];

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-3 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          ภาพรวม
        </h1>
        <p className="text-sm text-muted-foreground">
          สรุปยอดขายและข้อมูลประจำวัน
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 sm:p-6 border-border">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span
                className={`text-sm font-medium ${stat.positive ? "text-green-600" : "text-red-500"}`}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-6 border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              ออเดอร์ล่าสุด
            </h2>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary truncate px-1">
                        #{order.id.slice(0, 4)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {order.items}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.time}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-primary flex-shrink-0 ml-2">
                    ฿{order.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ยังไม่มีออเดอร์วันนี้</p>
            </div>
          )}
        </Card>

        {/* Top Selling */}
        <Card className="p-6 border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">เมนูขายดี</h2>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          {topSelling.length > 0 ? (
            <div className="space-y-4">
              {topSelling.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-600"
                            : index === 1
                              ? "bg-gray-100 text-gray-600"
                              : index === 2
                                ? "bg-orange-100 text-orange-600"
                                : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium text-foreground">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.sales} แก้ว
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ยังไม่มีข้อมูลการขาย</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
