"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  User,
  Phone,
  Award,
  LogOut,
  Gift,
  Calendar,
  ShoppingBag,
  Receipt,
} from "lucide-react";

interface MemberData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  tier: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  menu: {
    name: string;
    price: number;
  };
  toppings: {
    name: string;
    price: number;
  }[];
}

interface Order {
  id: string;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  pointsEarned: number;
  pointsUsed: number;
  orderItems: OrderItem[];
}

interface Discount {
  id: string;
  code: string;
  description: string | null;
  amount: number;
  pointsUsed: number | null;
  createdAt: string;
  order: {
    id: string;
    totalPrice: number;
    createdAt: string;
  } | null;
}

export default function MemberDashboardPage() {
  const router = useRouter();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pointsUsedOrders, setPointsUsedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);

  useEffect(() => {
    // Check if member is logged in
    const storedData = sessionStorage.getItem("memberData");
    if (!storedData) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      router.push("/member-login");
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setMemberData(data);
      // Fetch orders and discounts
      fetchOrders(data.id);
      fetchDiscounts(data.id);
    } catch (error) {
      console.error("Error parsing member data:", error);
      toast.error("เกิดข้อผิดพลาด กรุณาเข้าสู่ระบบใหม่");
      router.push("/member-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchOrders = async (memberId: string) => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`/api/members/${memberId}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchDiscounts = async (memberId: string) => {
    setLoadingDiscounts(true);
    try {
      const response = await fetch(`/api/members/${memberId}/discounts`);
      if (response.ok) {
        const data = await response.json();
        setPointsUsedOrders(data);
      }
    } catch (error) {
      console.error("Error fetching points used orders:", error);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("memberData");
    toast.success("ออกจากระบบสำเร็จ");
    router.push("/member-login");
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return "bg-gradient-to-r from-gray-400 to-gray-600 text-white";
      case "GOLD":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case "SILVER":
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800";
      case "BRONZE":
      default:
        return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return "แพลทินัม";
      case "GOLD":
        return "ทอง";
      case "SILVER":
        return "เงิน";
      case "BRONZE":
      default:
        return "บรอนซ์";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (!memberData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Logo */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 relative rounded-full overflow-hidden shadow-lg bg-white">
              <Image
                src="/NAICHA.png"
                alt="NAI CHA Logo"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">NAI CHA</h1>
              <p className="text-sm text-gray-600">ข้อมูลสมาชิก</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>

        {/* Main Info Card */}
        <Card className="overflow-hidden">
          <CardHeader className={`${getTierColor(memberData.tier)} py-8`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">
                    {memberData.name}
                  </CardTitle>
                  <CardDescription className="text-white/80 flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    {memberData.phone}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-white/30 text-white text-lg px-4 py-2 backdrop-blur-sm">
                <Award className="h-5 w-5 mr-2" />
                {getTierLabel(memberData.tier)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Points */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-3">
                  <Gift className="h-10 w-10 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600 mb-2">แต้มสะสม</p>
                <p className="text-4xl font-bold text-purple-600">
                  {memberData.points.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">คะแนน</p>
              </div>

              {/* Member Since */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-3">
                  <Calendar className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 mb-2">สมาชิกตั้งแต่</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatDate(memberData.createdAt)}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* How to earn points */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                วิธีการสะสมแต้ม
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-1.5"></div>
                  <p className="text-sm text-gray-700">
                    ซื้อสินค้า 1 แก้ว = 1 แต้ม
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-1.5"></div>
                  <p className="text-sm text-gray-700">
                    10 แต้ม แลกรับเครื่องดื่มฟรี 1 แก้ว หรือส่วนลด 25 บาท
                  </p>
                </div>
                {/* <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-1.5"></div>
                  <p className="text-sm text-gray-700">
                    ยิ่งซื้อบ่อย ยิ่งได้แต้มเยอะ!
                  </p>
                </div> */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              ประวัติการซื้อ
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              ประวัติการแลกแต้ม
            </TabsTrigger>
          </TabsList>

          {/* Orders History */}
          <TabsContent value="orders" className="space-y-4 mt-4">
            {loadingOrders ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  กำลังโหลด...
                </CardContent>
              </Card>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>ยังไม่มีประวัติการซื้อ</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                        <Badge
                          variant={
                            order.status === "COMPLETED"
                              ? "default"
                              : "secondary"
                          }
                          className="mt-1"
                        >
                          {order.status === "COMPLETED"
                            ? "เสร็จสิ้น"
                            : order.status === "PENDING"
                              ? "รอดำเนินการ"
                              : order.status === "PROCESSING"
                                ? "กำลังดำเนินการ"
                                : "ยกเลิก"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ฿{order.totalPrice.toFixed(2)}
                        </p>
                        {order.pointsEarned > 0 && (
                          <p className="text-xs text-green-600">
                            +{order.pointsEarned} แต้ม
                          </p>
                        )}
                        {order.pointsUsed > 0 && (
                          <p className="text-xs text-orange-600">
                            ใช้ {order.pointsUsed} แต้ม
                          </p>
                        )}
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-1">
                      {order.orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.menu.name} x{item.quantity}
                            {item.toppings.length > 0 &&
                              ` (${item.toppings.map((t) => t.name).join(", ")})`}
                          </span>
                          <span className="text-gray-600">
                            ฿
                            {(
                              item.menu.price * item.quantity +
                              item.toppings.reduce(
                                (sum, t) => sum + t.price,
                                0,
                              ) *
                                item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Discounts History */}
          <TabsContent value="discounts" className="space-y-4 mt-4">
            {loadingDiscounts ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  กำลังโหลด...
                </CardContent>
              </Card>
            ) : pointsUsedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>ยังไม่มีประวัติการแลกแต้ม</p>
                </CardContent>
              </Card>
            ) : (
              pointsUsedOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                        <Badge
                          variant={
                            order.status === "COMPLETED"
                              ? "default"
                              : "secondary"
                          }
                          className="mt-1"
                        >
                          {order.status === "COMPLETED"
                            ? "เสร็จสิ้น"
                            : order.status === "PENDING"
                              ? "รอดำเนินการ"
                              : order.status === "PROCESSING"
                                ? "กำลังดำเนินการ"
                                : "ยกเลิก"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ฿{order.totalPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-orange-600 font-semibold">
                          ใช้ {order.pointsUsed} แต้ม
                        </p>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-1">
                      {order.orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.menu.name} x{item.quantity}
                            {item.toppings.length > 0 &&
                              ` (${item.toppings.map((t) => t.name).join(", ")})`}
                          </span>
                          <span className="text-gray-600">
                            ฿
                            {(
                              item.menu.price * item.quantity +
                              item.toppings.reduce(
                                (sum, t) => sum + t.price,
                                0,
                              ) *
                                item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-600">
          <p>มีคำถาม? ติดต่อเจ้าหน้าที่ที่ร้าน</p>
        </div>
      </div>
    </div>
  );
}
