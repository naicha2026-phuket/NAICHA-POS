"use client";

import { useState, useEffect } from "react";
import {
  Award,
  Calendar,
  Coffee,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

interface BestsellerItem {
  rank: number;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
  categoryName?: string;
}

interface CategoryData {
  name: string;
  value: number;
  color?: string;
}

interface ToppingData {
  rank: number;
  name: string;
  orders: number;
  revenue: number;
}

const categoryColors: { [key: string]: string } = {
  กาแฟ: "#EC407A", // Pink
  ชา: "#AB47BC", // Purple
  นม: "#42A5F5", // Blue
  ปั่น: "#26A69A", // Teal
  ของหวาน: "#FFCA28", // Amber
  เครื่องดื่ม: "#66BB6A", // Green
  อื่นๆ: "#FF7043", // Deep Orange
};

export default function BestsellersPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("week");
  const [bestsellerData, setBestsellerData] = useState<BestsellerItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [toppingData, setToppingData] = useState<ToppingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchBestsellers();
  }, [period]);

  const fetchBestsellers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reports/bestsellers?period=${period}`);
      if (!response.ok) throw new Error("Failed to fetch bestsellers");

      const data = await response.json();

      setBestsellerData(data.bestsellers || []);

      // ชุดสีสำรอง สำหรับหมวดหมู่ที่ไม่ได้กำหนดไว้
      const fallbackColors = [
        "#5C6BC0",
        "#7E57C2",
        "#EF5350",
        "#29B6F6",
        "#FFA726",
        "#9CCC65",
        "#8D6E63",
        "#78909C",
      ];

      // Add colors to categories
      const categoriesWithColors = (data.categories || []).map(
        (cat: CategoryData, index: number) => ({
          ...cat,
          color:
            categoryColors[cat.name] ||
            fallbackColors[index % fallbackColors.length],
        }),
      );
      setCategoryData(categoriesWithColors);

      setToppingData(data.toppings || []);
    } catch (error) {
      console.error("Error fetching bestsellers:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสินค้ายอดนิยมได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalSales = categoryData.reduce((sum, d) => sum + d.value, 0);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (rank === 2) return "bg-gray-100 text-gray-600 border-gray-300";
    if (rank === 3) return "bg-orange-100 text-orange-600 border-orange-300";
    return "bg-secondary text-muted-foreground border-border";
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">เมนูขายดี</h1>
          <p className="text-muted-foreground">
            วิเคราะห์เมนูและท็อปปิ้งที่ขายดีที่สุด
          </p>
        </div>
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
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      ) : bestsellerData.length === 0 ? (
        <div className="text-center py-12">
          <Coffee className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">ไม่มีข้อมูลในช่วงเวลานี้</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top 3 Cards */}
            {bestsellerData.slice(0, 3).map((item, index) => (
              <Card
                key={item.rank}
                className={`p-6 border-2 ${
                  index === 0
                    ? "border-yellow-300 bg-yellow-50/50"
                    : index === 1
                      ? "border-gray-300 bg-gray-50/50"
                      : "border-orange-300 bg-orange-50/50"
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-600"
                        : index === 1
                          ? "bg-gray-100 text-gray-600"
                          : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {item.rank}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.categoryName}
                    </p>
                  </div>
                  {index === 0 && (
                    <Award className="w-6 h-6 text-yellow-500 ml-auto" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">จำนวนขาย</p>
                    <p className="text-xl font-bold text-foreground">
                      {item.sales} แก้ว
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">รายได้</p>
                    <p className="text-xl font-bold text-primary">
                      ฿{item.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-3 flex items-center gap-1 text-sm ${
                    item.growth >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {item.growth >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>
                    {item.growth >= 0 ? "+" : ""}
                    {item.growth}% จากสัปดาห์ก่อน
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Full Ranking Table */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                อันดับเมนูขายดี Top 10
              </h2>
              <div className="space-y-3">
                {bestsellerData.map((item) => (
                  <div
                    key={item.rank}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${getRankBadge(
                          item.rank,
                        )}`}
                      >
                        {item.rank}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.sales} แก้ว
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        ฿{item.revenue.toLocaleString()}
                      </p>
                      <p
                        className={`text-xs ${item.growth >= 0 ? "text-green-600" : "text-red-500"}`}
                      >
                        {item.growth >= 0 ? "+" : ""}
                        {item.growth}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Category Pie Chart */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                แยกตามหมวดหมู่
              </h2>
              {categoryData.length > 0 ? (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={true}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            `${value} แก้ว`,
                            "จำนวนขาย",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">รวมทั้งหมด</p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalSales} แก้ว
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">ไม่มีข้อมูล</p>
                </div>
              )}
            </Card>
          </div>

          {/* Top Toppings */}
          {toppingData.length > 0 && (
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                ท็อปปิ้งยอดนิยม
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {toppingData.map((item) => (
                  <div
                    key={item.rank}
                    className="p-4 bg-secondary/50 rounded-xl text-center"
                  >
                    <span
                      className={`inline-flex w-8 h-8 rounded-full items-center justify-center text-sm font-bold mb-2 ${getRankBadge(
                        item.rank,
                      )}`}
                    >
                      {item.rank}
                    </span>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.orders} ครั้ง
                    </p>
                    <p className="text-primary font-medium">
                      ฿{item.revenue.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
