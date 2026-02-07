"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Award,
  CreditCard,
  Phone,
  QrCode,
  Search,
  Star,
  User,
  X,
  Camera,
} from "lucide-react";
import { type Member, TIER_DISCOUNTS } from "@/lib/pos-types";
import dynamic from "next/dynamic";

// Dynamically import QR reader to avoid SSR issues
const QrReader = dynamic(
  () => import("react-qr-reader").then((mod) => mod.QrReader),
  {
    ssr: false,
    loading: () => <div className="text-center">กำลังโหลดกล้อง...</div>,
  },
);

interface MemberSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMember: (member: Member | null) => void;
  selectedMember: Member | null;
}

const tierColors = {
  bronze: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
  silver: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
  },
  gold: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-400",
  },
  platinum: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-400",
  },
};

const tierLabels = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
};

export function MemberSearchModal({
  open,
  onClose,
  onSelectMember,
  selectedMember,
}: MemberSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [scanError, setScanError] = useState<string>("");

  // Fetch members from database
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/members");
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();

      // Map database fields to Member interface
      const mappedMembers = data.map((m: any) => ({
        id: m.id,
        code: m.id.slice(0, 8).toUpperCase(), // Generate code from id
        name: m.name || "ไม่ระบุชื่อ",
        phone: m.phone,
        email: m.email,
        points: m.points || 0,
        totalSpent: 0, // Can be calculated from orders if needed
        joinDate: new Date(m.createdAt),
        lastVisit: m.updatedAt ? new Date(m.updatedAt) : undefined,
        tier: (m.tier?.toLowerCase() || "bronze") as Member["tier"],
      }));

      setMembers(mappedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.phone.includes(query) ||
        m.code.toLowerCase().includes(query),
    );
  }, [searchQuery, members]);

  const handleSelectMember = (member: Member) => {
    onSelectMember(member);
    onClose();
  };

  const handleRemoveMember = () => {
    onSelectMember(null);
    onClose();
  };

  const handleViewMemberQR = (member: Member) => {
    setViewingMember(member);
  };

  const handleQRScan = (result: any, error: any) => {
    if (result) {
      // Try to find member by code or ID from QR data
      const scannedData = result?.text || result;
      console.log("QR Scanned:", scannedData);

      const foundMember = members.find(
        (m) =>
          m.code === scannedData ||
          m.id === scannedData ||
          m.phone === scannedData,
      );

      if (foundMember) {
        // Show member details before closing
        setViewingMember(foundMember);
        setShowQRScanner(false);
        setScanError("");
      } else {
        setScanError("ไม่พบสมาชิกที่ตรงกับ QR Code นี้");
      }
    }

    if (error) {
      console.error("QR Scan Error:", error);
    }
  };

  const handleConfirmScannedMember = () => {
    if (viewingMember) {
      onSelectMember(viewingMember);
      setViewingMember(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border-border max-h-[90vh]">
        <DialogHeader className="p-4 border-b border-border bg-secondary/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              ค้นหาสมาชิก
            </DialogTitle>
          </div>
        </DialogHeader>

        {viewingMember ? (
          // Member QR Code View
          <div className="p-6 text-center">
            <button
              onClick={() => setViewingMember(null)}
              className="absolute top-16 left-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success Badge for Scanned Members */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                พบสมาชิกแล้ว
              </div>
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-4",
                tierColors[viewingMember.tier].bg,
                tierColors[viewingMember.tier].text,
              )}
            >
              <Star className="w-4 h-4" />
              {tierLabels[viewingMember.tier]}
            </div>

            <h3 className="text-xl font-bold text-foreground mb-1">
              {viewingMember.name}
            </h3>
            <p className="text-muted-foreground mb-6">{viewingMember.code}</p>

            {/* QR Code */}
            <div className="w-48 h-48 mx-auto bg-white rounded-2xl border-2 border-border flex items-center justify-center mb-6 shadow-lg">
              <div className="text-center">
                <QrCode className="w-32 h-32 text-foreground mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">
                  {viewingMember.code}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">แต้มสะสม</p>
                <p className="text-2xl font-bold text-primary">
                  {viewingMember.points.toLocaleString()}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">ส่วนลด</p>
                <p className="text-2xl font-bold text-green-600">
                  {TIER_DISCOUNTS[viewingMember.tier]}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleConfirmScannedMember}
                className="w-full bg-primary hover:bg-primary/90"
              >
                เลือกสมาชิกนี้
              </Button>
              <Button
                onClick={() => setViewingMember(null)}
                variant="outline"
                className="w-full border-border bg-transparent"
              >
                กลับ
              </Button>
            </div>
          </div>
        ) : showQRScanner ? (
          // QR Scanner View
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                สแกน QR Code สมาชิก
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                วาง QR Code บนบัตรสมาชิกให้อยู่ในกรอบ
              </p>
            </div>

            {/* QR Scanner */}
            <div className="w-full max-w-sm mx-auto mb-4 rounded-2xl overflow-hidden border-2 border-border">
              <QrReader
                onResult={handleQRScan}
                constraints={{
                  facingMode: "environment", // Use back camera
                }}
                containerStyle={{
                  width: "100%",
                  paddingTop: "100%",
                  position: "relative",
                }}
                videoStyle={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Scan Error Message */}
            {scanError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive text-center">
                  {scanError}
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-secondary/50 rounded-lg">
              <Camera className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                ตรวจสอบให้แน่ใจว่าได้อนุญาตการเข้าถึงกล้อง
              </p>
            </div>

            <Button
              onClick={() => {
                setShowQRScanner(false);
                setScanError("");
              }}
              variant="outline"
              className="w-full border-border bg-transparent"
            >
              ยกเลิก
            </Button>
          </div>
        ) : (
          // Search View
          <div className="p-4 space-y-4">
            {/* Current Selected Member */}
            {selectedMember && (
              <div
                className={cn(
                  "p-4 rounded-xl border-2",
                  tierColors[selectedMember.tier].border,
                  "bg-secondary/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        tierColors[selectedMember.tier].bg,
                      )}
                    >
                      <User
                        className={cn(
                          "w-6 h-6",
                          tierColors[selectedMember.tier].text,
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {selectedMember.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs",
                            tierColors[selectedMember.tier].bg,
                            tierColors[selectedMember.tier].text,
                          )}
                        >
                          {tierLabels[selectedMember.tier]}
                        </span>
                        <span className="text-primary font-medium">
                          {selectedMember.points} แต้ม
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveMember}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ, เบอร์โทร หรือรหัสสมาชิก..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-foreground bg-secondary/30 border-border"
              />
            </div>

            {/* QR Scan Button */}
            <Button
              onClick={() => setShowQRScanner(true)}
              variant="outline"
              className="w-full h-12 border-primary/30 text-primary hover:bg-primary/10 bg-transparent"
            >
              <QrCode className="w-5 h-5 mr-2" />
              สแกน QR Code สมาชิก
            </Button>

            {/* Member List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-muted-foreground">กำลังโหลด...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">ไม่พบสมาชิก</p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className={cn(
                      "p-3 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors cursor-pointer",
                      selectedMember?.id === member.id && "ring-2 ring-primary",
                    )}
                    onClick={() => handleSelectMember(member)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          tierColors[member.tier].bg,
                        )}
                      >
                        <User
                          className={cn(
                            "w-5 h-5",
                            tierColors[member.tier].text,
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {member.name}
                          </p>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs",
                              tierColors[member.tier].bg,
                              tierColors[member.tier].text,
                            )}
                          >
                            {tierLabels[member.tier]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {member.code}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {member.points.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">แต้ม</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewMemberQR(member);
                        }}
                        className="p-2 rounded-lg hover:bg-secondary"
                      >
                        <QrCode className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
