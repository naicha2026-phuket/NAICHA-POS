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

export default function RegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    confirmPin: "",
  });

  // Check if PIN and confirm PIN match
  const pinMismatch =
    formData.confirmPin.length > 0 &&
    formData.pin.length > 0 &&
    formData.pin !== formData.confirmPin;

  const pinInvalid =
    formData.pin.length > 0 &&
    (formData.pin.length !== 6 || !/^\d+$/.test(formData.pin));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.phone || !formData.pin) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (formData.pin.length !== 6) {
      toast.error("PIN ต้องมี 6 หลัก");
      return;
    }

    if (!/^\d+$/.test(formData.pin)) {
      toast.error("PIN ต้องเป็นตัวเลขเท่านั้น");
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      toast.error("PIN ไม่ตรงกัน");
      return;
    }

    if (!/^0\d{9}$/.test(formData.phone)) {
      toast.error("เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นเบอร์ 10 หลัก)");
      return;
    }

    setLoading(true);

    try {
      console.log("Sending registration data:", {
        name: formData.name,
        phone: formData.phone,
        pin: formData.pin,
      });

      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          pin: formData.pin,
          email: "",
          points: 0,
        }),
      });

      const data = await response.json();
      console.log("Registration response:", response.status, data);

      if (!response.ok) {
        if (data.error === "หมายเลขโทรศัพท์นี้ถูกลงทะเบียนแล้ว") {
          toast.error("หมายเลขนี้ถูกลงทะเบียนแล้ว", {
            description: "กรุณาใช้เบอร์โทรศัพท์อื่น หรือเข้าสู่ระบบ",
            action: {
              label: "เข้าสู่ระบบ",
              onClick: () => router.push("/member-login"),
            },
            duration: 5000,
          });
        } else {
          toast.error(data.error || "ไม่สามารถลงทะเบียนได้");
        }
        return;
      }

      toast.success("ลงทะเบียนสำเร็จ!", {
        description: "กำลังนำคุณไปหน้าเข้าสู่ระบบ...",
      });

      // Clear form
      setFormData({
        name: "",
        phone: "",
        pin: "",
        confirmPin: "",
      });

      setTimeout(() => {
        router.push("/member-login");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ", {
        description: "กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            ลงทะเบียนสมาชิก
          </CardTitle>
          <CardDescription className="text-center">
            กรอกข้อมูลเพื่อเป็นสมาชิกและรับสิทธิประโยชน์
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
              <Input
                id="name"
                type="text"
                placeholder="กรอกชื่อ-นามสกุล"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
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
              <Label htmlFor="pin">สร้าง PIN (6 หลัก) *</Label>
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
              {pinInvalid && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span>⚠️</span> PIN ต้องเป็นตัวเลข 6 หลัก
                </p>
              )}
              {!pinInvalid && (
                <p className="text-xs text-gray-500">
                  PIN ต้องเป็นตัวเลข 6 หลัก สำหรับเข้าสู่ระบบ
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">ยืนยัน PIN *</Label>
              <div className="relative">
                <Input
                  id="confirmPin"
                  type={showConfirmPin ? "text" : "password"}
                  placeholder="••••••"
                  value={formData.confirmPin}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPin: e.target.value })
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
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  disabled={loading}
                >
                  {showConfirmPin ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {pinMismatch && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span>⚠️</span> PIN ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง
                </p>
              )}
              {!pinMismatch &&
                formData.confirmPin.length === 6 &&
                formData.pin === formData.confirmPin && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span>✓</span> PIN ตรงกัน
                  </p>
                )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || pinMismatch || pinInvalid}
            >
              {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">มีบัญชีอยู่แล้ว? </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={() => router.push("/member-login")}
                disabled={loading}
              >
                เข้าสู่ระบบ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
