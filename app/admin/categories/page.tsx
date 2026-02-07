"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Edit, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function CategoryManagement() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/category");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลหมวดหมู่ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อหมวดหมู่",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (editingCategory) {
        // Update existing category
        const response = await fetch(`/api/category/${editingCategory.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
        });

        if (!response.ok) throw new Error("Failed to update category");
        const updatedCategory = await response.json();
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id ? updatedCategory : cat,
          ),
        );
        toast({
          title: "สำเร็จ",
          description: "อัปเดตหมวดหมู่สำเร็จ",
        });
      } else {
        // Add new category
        const response = await fetch("/api/category", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
        });

        if (!response.ok) throw new Error("Failed to create category");
        await fetchCategories();
        toast({
          title: "สำเร็จ",
          description: "เพิ่มหมวดหมู่สำเร็จ",
        });
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm("ต้องการลบหมวดหมู่นี้? (จะไม่สามารถลบได้หากมีเมนูในหมวดหมู่นี้)")
    )
      return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/category/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      toast({
        title: "สำเร็จ",
        description: "ลบหมวดหมู่สำเร็จ",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error instanceof Error ? error.message : "ไม่สามารถลบหมวดหมู่ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <FolderOpen className="w-8 h-8 text-muted-foreground animate-pulse" />
          <p className="ml-3 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            จัดการหมวดหมู่
          </h1>
          <p className="text-sm text-muted-foreground">
            เพิ่ม แก้ไข หรือลบหมวดหมู่เมนู
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-pink-hover w-full sm:w-auto"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มหมวดหมู่ใหม่
        </Button>
      </div>

      {/* Search */}
      <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาหมวดหมู่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filteredCategories.map((category) => (
          <Card
            key={category.id}
            className="p-3 sm:p-4 border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary flex items-center justify-center">
                <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-2">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {category.description}
              </p>
            )}
            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => handleOpenModal(category)}
              >
                <Edit className="w-4 h-4 mr-1" />
                แก้ไข
              </Button>
              {/* <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 border-destructive/30 bg-transparent"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button> */}
            </div>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ไม่พบหมวดหมู่ที่ค้นหา</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อหมวดหมู่</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="เช่น ชานม, กาแฟ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย (ถ้ามี)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="รายละเอียดเพิ่มเติม"
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
              disabled={!formData.name || isLoading}
            >
              {isLoading
                ? "กำลังบันทึก..."
                : editingCategory
                  ? "บันทึก"
                  : "เพิ่มหมวดหมู่"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
