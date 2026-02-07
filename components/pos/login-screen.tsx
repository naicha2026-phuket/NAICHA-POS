"use client";

import { useState } from "react";
import { Coffee, Delete, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";

export function LoginScreen() {
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError("");
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      setError("กรุณากรอก PIN 6 หลัก");
      return;
    }

    const employee = await login(pin);
    if (!employee) {
      setError("PIN ไม่ถูกต้อง");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-pink-light">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          {/* <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-10 h-10 text-primary-foreground" />
          </div> */}
          <Image
            src="/NAICHA.png"
            alt="POS Logo"
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-foreground">
            เข้าสู่ระบบ
          </h1>
          <p className="text-muted-foreground mt-1">กรุณากรอก PIN 6 หลัก</p>
        </div>

        {/* PIN Display */}
        <div
          className={`flex justify-center gap-3 mb-6 ${isShaking ? "animate-shake" : ""}`}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
                pin.length > i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted"
              }`}
            >
              {pin.length > i ? "●" : ""}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-destructive text-center text-sm mb-4 font-medium">
            {error}
          </p>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-16 text-2xl font-medium hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-200 active:scale-95 bg-transparent"
              onClick={() => handleNumberClick(num.toString())}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="outline"
            className="h-16 text-lg font-medium hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-200 bg-transparent"
            onClick={handleClear}
          >
            ล้าง
          </Button>
          <Button
            variant="outline"
            className="h-16 text-2xl font-medium hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-200 active:scale-95 bg-transparent"
            onClick={() => handleNumberClick("0")}
          >
            0
          </Button>
          <Button
            variant="outline"
            className="h-16 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-200 bg-transparent"
            onClick={handleDelete}
          >
            <Delete className="w-6 h-6" />
          </Button>
        </div>

        {/* Submit Button */}
        <Button
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-pink-hover transition-all duration-200"
          onClick={handleSubmit}
          disabled={pin.length !== 6}
        >
          <LogIn className="w-5 h-5 mr-2" />
          เข้าสู่ระบบ
        </Button>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-muted rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            กรอก PIN 6 หลักที่ได้รับจากผู้ดูแลระบบ
          </p>
        </div>
      </Card>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
