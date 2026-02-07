"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Cookie, Edit, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Topping {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export default function ToppingsManagement() {
  const { toast } = useToast();
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Topping | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: Topping | null;
    newStatus: boolean;
  }>({ isOpen: false, item: null, newStatus: false });
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    isAvailable: true,
  });

  useEffect(() => {
    fetchToppings();
  }, []);

  const fetchToppings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/topping");
      if (!response.ok) throw new Error("Failed to fetch toppings");
      const data = await response.json();
      setToppings(data);
    } catch (error) {
      console.error("Error fetching toppings:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลท็อปปิ้งได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredToppings = toppings.filter((topping) => {
    const matchesSearch = topping.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesAvailability = showUnavailable || topping.isAvailable;
    return matchesSearch && matchesAvailability;
  });

  const handleOpenModal = (item?: Topping) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        isAvailable: item.isAvailable,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        price: "",
        isAvailable: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: "", price: "", isAvailable: true });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (editingItem) {
        // Update existing topping
        const response = await fetch(`/api/topping/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            price: parseFloat(formData.price),
            isAvailable: formData.isAvailable,
          }),
        });

        if (!response.ok) throw new Error("Failed to update topping");
        const updatedTopping = await response.json();
        setToppings((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? updatedTopping : item,
          ),
        );
        toast({
          title: "สำเร็จ",
          description: "อัปเดตท็อปปิ้งสำเร็จ",
        });
      } else {
        // Add new topping
        const response = await fetch("/api/topping", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            price: parseFloat(formData.price),
            isAvailable: formData.isAvailable,
          }),
        });

        if (!response.ok) throw new Error("Failed to create topping");
        await fetchToppings();
        toast({
          title: "สำเร็จ",
          description: "เพิ่มท็อปปิ้งสำเร็จ",
        });
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving topping:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = (item: Topping) => {
    const newStatus = !item.isAvailable;
    setConfirmDialog({ isOpen: true, item, newStatus });
  };

  const confirmToggleAvailability = async () => {
    if (!confirmDialog.item) return;

    const { item, newStatus } = confirmDialog;
    setConfirmDialog({ isOpen: false, item: null, newStatus: false });
    setIsLoading(true);
    try {
      const response = await fetch(`/api/topping/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: item.name,
          price: item.price,
          isAvailable: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update topping");
      const updatedTopping = await response.json();
      setToppings((prev) =>
        prev.map((i) => (i.id === item.id ? updatedTopping : i)),
      );
      toast({
        title: "สำเร็จ",
        description: newStatus
          ? "เปิดใช้งานท็อปปิ้งสำเร็จ"
          : "ปิดใช้งานท็อปปิ้งสำเร็จ",
      });
    } catch (error) {
      console.error("Error updating topping:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะท็อปปิ้งได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && toppings.length === 0) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <Cookie className="w-8 h-8 text-muted-foreground animate-pulse" />
          <p className="ml-3 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            จัดการท็อปปิ้ง
          </h1>
          <p className="text-muted-foreground">
            เพิ่ม แก้ไข หรือลบท็อปปิ้งเครื่องดื่ม
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-pink-hover"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มท็อปปิ้งใหม่
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6 border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาท็อปปิ้ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Switch
              id="show-unavailable"
              checked={showUnavailable}
              onCheckedChange={setShowUnavailable}
            />
            <Label htmlFor="show-unavailable" className="cursor-pointer">
              แสดงท็อปปิ้งที่ปิดใช้งาน
            </Label>
          </div>
        </div>
      </Card>

      {/* Toppings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredToppings.map((item) => (
          <Card
            key={item.id}
            className={`p-4 border-border hover:shadow-md transition-shadow ${
              !item.isAvailable ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              {!item.isAvailable && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                  ปิดใช้งาน
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
            <p className="text-xl font-bold text-primary mb-3">
              +฿{item.price}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => handleOpenModal(item)}
              >
                <Edit className="w-4 h-4 mr-1" />
                แก้ไข
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${
                  item.isAvailable
                    ? "text-destructive hover:bg-destructive/10 border-destructive/30"
                    : "text-green-600 hover:bg-green-50 border-green-300"
                } bg-transparent`}
                onClick={() => handleToggleAvailability(item)}
              >
                {item.isAvailable ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Cookie className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredToppings.length === 0 && (
        <div className="text-center py-12">
          <Cookie className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ไม่พบท็อปปิ้งที่ค้นหา</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {editingItem ? "แก้ไขท็อปปิ้ง" : "เพิ่มท็อปปิ้งใหม่"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อท็อปปิ้ง</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="เช่น ไข่มุก"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">ราคาเพิ่ม (บาท)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={handleCloseModal}
            >
              ยกเลิก
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-pink-hover"
              onClick={handleSave}
              disabled={!formData.name || !formData.price || isLoading}
            >
              {isLoading
                ? "กำลังบันทึก..."
                : editingItem
                  ? "บันทึก"
                  : "เพิ่มท็อปปิ้ง"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setConfirmDialog({ isOpen: false, item: null, newStatus: false })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.newStatus
                ? "เปิดใช้งานท็อปปิ้ง"
                : "ปิดใช้งานท็อปปิ้ง"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.newStatus
                ? `ต้องการเปิดใช้งานท็อปปิ้ง "${confirmDialog.item?.name}" หรือไม่?`
                : `ต้องการปิดใช้งานท็อปปิ้ง "${confirmDialog.item?.name}" หรือไม่?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleAvailability}
              className="bg-primary hover:bg-pink-hover"
            >
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
