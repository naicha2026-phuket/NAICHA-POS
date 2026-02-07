"use client";

import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Edit,
  Gift,
  History,
  Mail,
  Phone,
  Plus,
  QrCode,
  Search,
  Star,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  points: number;
  createdAt: string;
  updatedAt: string | null;
  pin: string | null;
}

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
};

const TIER_DISCOUNTS = {
  bronze: 0,
  silver: 5,
  gold: 10,
  platinum: 15,
};

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
};

type TierType = keyof typeof tierColors;

function getTier(points: number): TierType {
  if (points >= TIER_THRESHOLDS.platinum) return "platinum";
  if (points >= TIER_THRESHOLDS.gold) return "gold";
  if (points >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

export default function MembersPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/members");
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสมาชิกได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    let result = members.map((m) => ({
      ...m,
      tier: getTier(m.points),
      totalSpent: m.points * 10, // Estimate based on points
      joinDate: new Date(m.createdAt),
      code: `M${m.id.substring(0, 3).toUpperCase()}`,
    }));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name?.toLowerCase().includes(query) ||
          m.phone.includes(query) ||
          m.code.toLowerCase().includes(query),
      );
    }
    if (filterTier !== "all") {
      result = result.filter((m) => m.tier === filterTier);
    }
    return result;
  }, [members, searchQuery, filterTier]);

  const stats = useMemo(() => {
    const membersWithTier = members.map((m) => ({
      ...m,
      tier: getTier(m.points),
    }));
    return {
      total: members.length,
      bronze: membersWithTier.filter((m) => m.tier === "bronze").length,
      silver: membersWithTier.filter((m) => m.tier === "silver").length,
      gold: membersWithTier.filter((m) => m.tier === "gold").length,
      platinum: membersWithTier.filter((m) => m.tier === "platinum").length,
      totalPoints: members.reduce((sum, m) => sum + m.points, 0),
    };
  }, [members]);

  const handleAddMember = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อและเบอร์โทรศัพท์",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          points: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create member");
      }

      await fetchMembers();
      setFormData({ name: "", phone: "", email: "" });
      setIsAddModalOpen(false);
      toast({
        title: "สำเร็จ",
        description: "เพิ่มสมาชิกสำเร็จ",
      });
    } catch (error) {
      console.error("Error creating member:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถเพิ่มสมาชิกได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMember = async () => {
    if (!editingMember || !formData.name || !formData.phone) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อและเบอร์โทรศัพท์",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/members/${editingMember.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update member");
      }

      await fetchMembers();
      setEditingMember(null);
      setFormData({ name: "", phone: "", email: "" });
      toast({
        title: "สำเร็จ",
        description: "อัปเดตสมาชิกสำเร็จ",
      });
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถอัปเดตสมาชิกได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("ต้องการลบสมาชิกนี้หรือไม่?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete member");

      await fetchMembers();
      toast({
        title: "สำเร็จ",
        description: "ลบสมาชิกสำเร็จ",
      });
    } catch (error) {
      console.error("Error deleting member:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบสมาชิกได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (member: (typeof filteredMembers)[0]) => {
    const originalMember = members.find((m) => m.id === member.id);
    if (!originalMember) return;

    setEditingMember(originalMember);
    setFormData({
      name: originalMember.name || "",
      phone: originalMember.phone,
      email: originalMember.email || "",
    });
  };

  if (isLoading && members.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Users className="w-8 h-8 text-muted-foreground animate-pulse" />
          <p className="ml-3 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            จัดการสมาชิก
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการข้อมูลสมาชิกและดูแต้มสะสม
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: "", phone: "", email: "" });
            setIsAddModalOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มสมาชิก
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                สมาชิกทั้งหมด
              </p>
            </div>
          </div>
        </div>
        {(["bronze", "silver", "gold", "platinum"] as const).map((tier) => (
          <div
            key={tier}
            className={cn("p-3 sm:p-4 rounded-xl", tierColors[tier].bg)}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/50 flex items-center justify-center">
                <Star
                  className={cn("w-4 h-4 sm:w-5 sm:h-5", tierColors[tier].text)}
                />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-lg sm:text-2xl font-bold",
                    tierColors[tier].text,
                  )}
                >
                  {stats[tier]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {tierLabels[tier]}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                {stats.totalPoints.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">แต้มรวม</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input
            placeholder="ค้นหา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border text-foreground"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <button
            onClick={() => setFilterTier("all")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0",
              filterTier === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-accent",
            )}
          >
            ทั้งหมด
          </button>
          {(["bronze", "silver", "gold", "platinum"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0",
                filterTier === tier
                  ? cn(tierColors[tier].bg, tierColors[tier].text)
                  : "bg-secondary text-foreground hover:bg-accent",
              )}
            >
              {tierLabels[tier]}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                สมาชิก
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                รหัส
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                ติดต่อ
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                ระดับ
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                แต้มสะสม
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                ยอดใช้จ่าย
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredMembers.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        tierColors[member.tier].bg,
                      )}
                    >
                      <User
                        className={cn("w-5 h-5", tierColors[member.tier].text)}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        สมัคร {member.joinDate.toLocaleDateString("th-TH")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-sm text-foreground">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    {member.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-sm text-foreground">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {member.phone}
                    </p>
                    {member.email && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
                      tierColors[member.tier].bg,
                      tierColors[member.tier].text,
                    )}
                  >
                    <Star className="w-3 h-3" />
                    {tierLabels[member.tier]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="text-lg font-bold text-primary">
                    {member.points.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">แต้ม</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-medium text-foreground">
                    ฿{member.totalSpent.toLocaleString()}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setViewingMember(member)}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"
                      title="ดู QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                      title="แก้ไข"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">ไม่พบสมาชิก</p>
          </div>
        )}
      </div>

      {/* Add/Edit Member Modal */}
      <Dialog
        open={isAddModalOpen || !!editingMember}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingMember(null);
            setFormData({ name: "", phone: "", email: "" });
          }
        }}
      >
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingMember ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มสมาชิกใหม่"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                ชื่อ-นามสกุล <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="นายสมชาย ใจดี"
                className="bg-secondary/30 border-border text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                เบอร์โทรศัพท์ <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="0812345678"
                className="bg-secondary/30 border-border text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                อีเมล
              </label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@example.com"
                className="bg-secondary/30 border-border text-foreground"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMember(null);
                  setFormData({ name: "", phone: "", email: "" });
                }}
                className="flex-1 border-border bg-transparent"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={editingMember ? handleEditMember : handleAddMember}
                disabled={!formData.name || !formData.phone || isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading
                  ? "กำลังบันทึก..."
                  : editingMember
                    ? "บันทึก"
                    : "เพิ่มสมาชิก"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Member QR Modal */}
      <Dialog
        open={!!viewingMember}
        onOpenChange={(open) => !open && setViewingMember(null)}
      >
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-center">
              QR Code สมาชิก
            </DialogTitle>
          </DialogHeader>
          {viewingMember && (
            <div className="text-center py-4">
              <div
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-4",
                  tierColors[getTier(viewingMember.points)].bg,
                  tierColors[getTier(viewingMember.points)].text,
                )}
              >
                <Star className="w-4 h-4" />
                {tierLabels[getTier(viewingMember.points)]}
              </div>

              <h3 className="text-xl font-bold text-foreground mb-1">
                {viewingMember.name}
              </h3>
              <p className="text-muted-foreground mb-6">{`M${viewingMember.id.substring(0, 3).toUpperCase()}`}</p>

              <div className="w-48 h-48 mx-auto bg-white rounded-2xl border-2 border-border flex items-center justify-center mb-6 shadow-lg">
                <div className="text-center">
                  <QrCode className="w-32 h-32 text-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">{`M${viewingMember.id.substring(0, 3).toUpperCase()}`}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">แต้มสะสม</p>
                  <p className="text-2xl font-bold text-primary">
                    {viewingMember.points.toLocaleString()}
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">ส่วนลด</p>
                  <p className="text-2xl font-bold text-green-600">
                    {TIER_DISCOUNTS[getTier(viewingMember.points)]}%
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                เบอร์โทร: {viewingMember.phone}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
