"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Plus,
  Search,
  Trash2,
  User,
  Shield,
  UserCog,
  Eye,
  EyeOff,
} from "lucide-react";

interface Staff {
  id: string;
  name: string;
  phone: string;
  pin: string;
  role: "ADMIN" | "CASHIER" | "MANAGER";
  isActive: boolean;
  createdAt: string;
  _count?: {
    shifts: number;
  };
}

const roleLabels = {
  ADMIN: "ผู้ดูแลระบบ",
  MANAGER: "ผู้จัดการ",
  CASHIER: "แคชเชียร์",
};

const roleIcons = {
  ADMIN: Shield,
  MANAGER: UserCog,
  CASHIER: User,
};

const roleColors = {
  ADMIN: "text-red-600 bg-red-50",
  MANAGER: "text-blue-600 bg-blue-50",
  CASHIER: "text-green-600 bg-green-50",
};

export default function StaffPage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    role: "CASHIER" as "ADMIN" | "CASHIER" | "MANAGER",
    isActive: true,
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff");
      if (!response.ok) throw new Error("Failed to fetch staff");
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const handleOpenDialog = (staffMember?: Staff) => {
    setShowPin(false);
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        name: staffMember.name,
        phone: staffMember.phone,
        pin: "",
        role: staffMember.role,
        isActive: staffMember.isActive,
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: "",
        phone: "",
        pin: "",
        role: "CASHIER",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStaff(null);
    setFormData({
      name: "",
      phone: "",
      pin: "",
      role: "CASHIER",
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingStaff ? `/api/staff/${editingStaff.id}` : "/api/staff";
      const method = editingStaff ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "เกิดข้อผิดพลาด",
          description: error.error || "เกิดข้อผิดพลาด",
          variant: "destructive",
        });
        return;
      }

      await fetchStaff();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบพนักงานคนนี้หรือไม่?")) return;

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete staff");

      await fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการลบข้อมูล",
        variant: "destructive",
      });
    }
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery),
  );

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            จัดการพนักงาน
          </h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลพนักงานและสิทธิ์การเข้าถึง
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มพนักงาน
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="ค้นหาพนักงาน (ชื่อ, เบอร์โทร)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                พนักงานทั้งหมด
              </p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">
                {staff.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">ผู้ดูแลระบบ</p>
              <p className="text-2xl font-bold text-foreground">
                {staff.filter((s) => s.role === "ADMIN").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ผู้จัดการ</p>
              <p className="text-2xl font-bold text-foreground">
                {staff.filter((s) => s.role === "MANAGER").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">แคชเชียร์</p>
              <p className="text-2xl font-bold text-foreground">
                {staff.filter((s) => s.role === "CASHIER").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staffMember) => {
          const RoleIcon = roleIcons[staffMember.role];
          return (
            <Card key={staffMember.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {staffMember.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {staffMember.phone}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(staffMember)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(staffMember.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    roleColors[staffMember.role]
                  }`}
                >
                  <RoleIcon className="w-3 h-3" />
                  {roleLabels[staffMember.role]}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">สถานะ</span>
                  <span
                    className={`text-xs font-medium ${
                      staffMember.isActive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {staffMember.isActive ? "ใช้งาน" : "ปิดการใช้งาน"}
                  </span>
                </div>

                {staffMember._count && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      กะทำงาน
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {staffMember._count.shifts} กะ
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ไม่พบข้อมูลพนักงาน</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                ชื่อ-นามสกุล *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="กรอกชื่อ-นามสกุล"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                เบอร์โทรศัพท์ *
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="กรอกเบอร์โทรศัพท์"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                PIN (6 หลัก) {editingStaff ? "(เว้นว่างหากไม่เปลี่ยน)" : "*"}
              </label>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData({ ...formData, pin: e.target.value })
                  }
                  placeholder="กรอก PIN 6 หลัก"
                  maxLength={6}
                  required={!editingStaff}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                ตำแหน่ง *
              </label>
              <Select
                value={formData.role}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASHIER">แคชเชียร์</SelectItem>
                  <SelectItem value="MANAGER">ผู้จัดการ</SelectItem>
                  <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="isActive" className="text-sm text-foreground">
                เปิดใช้งาน
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
