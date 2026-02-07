"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function MemberLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    pin: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone || !formData.pin) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (formData.pin.length !== 6) {
      toast.error("PIN ต้องมี 6 หลัก");
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting login with:", {
        phone: formData.phone,
        pin: formData.pin,
      });

      const response = await fetch("/api/members/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formData.phone,
          pin: formData.pin,
        }),
      });

      const data = await response.json();
      console.log("Login response:", {
        status: response.status,
        data: data,
      });

      if (!response.ok) {
        // Handle specific error messages
        if (data.error === "ไม่พบหมายเลขโทรศัพท์") {
          toast.error("ไม่พบหมายเลขโทรศัพท์นี้ในระบบ", {
            description: "คุณยังไม่ได้ลงทะเบียนหรือกรอกเบอร์ผิด",
            action: {
              label: "ลงทะเบียน",
              onClick: () => router.push("/register"),
            },
            duration: 5000,
          });
        } else if (data.error === "PIN ไม่ถูกต้อง") {
          toast.error("PIN ไม่ถูกต้อง", {
            description: "กรุณาตรวจสอบ PIN ของคุณอีกครั้ง",
            duration: 4000,
          });
        } else {
          toast.error(data.error || "ไม่สามารถเข้าสู่ระบบได้");
        }
        setLoading(false);
        return;
      }

      // Store member data in sessionStorage
      sessionStorage.setItem("memberData", JSON.stringify(data));
      toast.success("เข้าสู่ระบบสำเร็จ!");

      setTimeout(() => {
        router.push("/member-dashboard");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            เข้าสู่ระบบสมาชิก
          </CardTitle>
          <CardDescription className="text-center">
            เข้าสู่ระบบเพื่อดูแต้มสะสมของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0812345678"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                maxLength={10}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  placeholder="••••••"
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData({ ...formData, pin: e.target.value })
                  }
                  maxLength={6}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPin(!showPin)}
                  disabled={loading}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">ยังไม่เป็นสมาชิก? </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={() => router.push("/register")}
                disabled={loading}
              >
                ลงทะเบียน
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
