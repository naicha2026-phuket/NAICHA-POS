"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Coffee,
  Edit,
  Plus,
  Search,
  Trash2,
  X,
  Upload,
  Loader2,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  recipe: string | null;
  categoryId: string;
  isAvailable: boolean;
  category: {
    id: string;
    name: string;
  };
}

export default function MenuManagement() {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: MenuItem | null;
    newStatus: boolean;
  }>({ isOpen: false, item: null, newStatus: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedRecipeImageFile, setSelectedRecipeImageFile] =
    useState<File | null>(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    recipeImageUrl: "",
    isAvailable: true,
  });

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/menu");
      if (!response.ok) throw new Error("Failed to fetch menu items");
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลเมนูได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
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
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    const matchesAvailability = showUnavailable || item.isAvailable;
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        categoryId: item.categoryId,
        imageUrl: item.imageUrl || "",
        recipeImageUrl: item.recipe || "",
        isAvailable: item.isAvailable,
      });
      setImagePreview(item.imageUrl);
      setRecipeImagePreview(item.recipe);
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        imageUrl: "",
        recipeImageUrl: "",
        isAvailable: true,
      });
      setImagePreview(null);
      setRecipeImagePreview(null);
    }
    setSelectedImageFile(null);
    setSelectedRecipeImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ไฟล์ใหญ่เกินไป",
          description: "ขนาดไฟล์ต้องไม่เกิน 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleRecipeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ไฟล์ใหญ่เกินไป",
          description: "ขนาดไฟล์ต้องไม่เกิน 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedRecipeImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecipeImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveRecipeImage = () => {
    setSelectedRecipeImageFile(null);
    setRecipeImagePreview(null);
    setFormData((prev) => ({ ...prev, recipeImageUrl: "" }));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setSelectedImageFile(null);
    setImagePreview(null);
    setSelectedRecipeImageFile(null);
    setRecipeImagePreview(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      imageUrl: "",
      recipeImageUrl: "",
      isAvailable: true,
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = formData.imageUrl;
      let recipeImageUrl = formData.recipeImageUrl;

      // Upload image if a new file was selected
      if (selectedImageFile) {
        setIsUploading(true);
        const uploadedUrl = await uploadImage(selectedImageFile, "menu-images");
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          throw new Error("Failed to upload image");
        }
        setIsUploading(false);
      }

      // Upload recipe image if a new file was selected
      if (selectedRecipeImageFile) {
        setIsUploading(true);
        const uploadedUrl = await uploadImage(
          selectedRecipeImageFile,
          "recipe-images",
        );
        if (uploadedUrl) {
          recipeImageUrl = uploadedUrl;
        } else {
          throw new Error("Failed to upload recipe image");
        }
        setIsUploading(false);
      }

      if (editingItem) {
        // Update existing item
        const response = await fetch(`/api/menu/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            categoryId: formData.categoryId,
            imageUrl: imageUrl || null,
            recipe: recipeImageUrl || null,
            isAvailable: formData.isAvailable,
          }),
        });

        if (!response.ok) throw new Error("Failed to update menu item");
        const updatedItem = await response.json();
        setMenuItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updatedItem : item)),
        );
        toast({
          title: "สำเร็จ",
          description: "อัปเดตเมนูสำเร็จ",
        });
      } else {
        // Add new item
        const response = await fetch("/api/menu", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.categoryId,
            image: imageUrl || null,
            recipe: recipeImageUrl || null,
            isAvailable: formData.isAvailable,
          }),
        });

        if (!response.ok) throw new Error("Failed to create menu item");
        await fetchMenuItems();
        toast({
          title: "สำเร็จ",
          description: "เพิ่มเมนูสำเร็จ",
        });
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleToggleAvailability = (item: MenuItem) => {
    const newStatus = !item.isAvailable;
    setConfirmDialog({ isOpen: true, item, newStatus });
  };

  const confirmToggleAvailability = async () => {
    if (!confirmDialog.item) return;

    const { item, newStatus } = confirmDialog;
    setConfirmDialog({ isOpen: false, item: null, newStatus: false });
    setIsLoading(true);
    try {
      const response = await fetch(`/api/menu/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          price: item.price,
          categoryId: item.categoryId,
          imageUrl: item.imageUrl,
          recipe: item.recipe,
          isAvailable: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update menu item");
      const updatedItem = await response.json();
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? updatedItem : i)),
      );
      toast({
        title: "สำเร็จ",
        description: newStatus ? "เปิดใช้งานเมนูสำเร็จ" : "ปิดใช้งานเมนูสำเร็จ",
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะเมนูได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && menuItems.length === 0) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <Coffee className="w-8 h-8 text-muted-foreground animate-pulse" />
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
          <h1 className="text-2xl font-bold text-foreground">จัดการเมนู</h1>
          <p className="text-muted-foreground">
            เพิ่ม แก้ไข หรือลบเมนูเครื่องดื่ม
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-pink-hover"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มเมนูใหม่
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6 border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเมนู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="หมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Switch
              id="show-unavailable"
              checked={showUnavailable}
              onCheckedChange={setShowUnavailable}
            />
            <Label htmlFor="show-unavailable" className="cursor-pointer">
              แสดงเมนูที่ปิดใช้งาน
            </Label>
          </div>
        </div>
      </Card>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={`p-5 border-border hover:shadow-md transition-shadow ${
              !item.isAvailable ? "opacity-60" : ""
            }`}
          >
            <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-secondary">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Coffee className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Coffee className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2 l bg-pink-light text-primary">
                  {item.category?.name || getCategoryName(item.categoryId)}
                </span>
                {!item.isAvailable && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                    ปิดใช้งาน
                  </span>
                )}
              </div>
            </div>
            <h3 className="font-semibold text-foreground ">{item.name}</h3>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
            <p className="text-xl font-bold text-primary">฿{item.price}</p>
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
                  <Coffee className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ไม่พบเมนูที่ค้นหา</p>
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
                {editingItem ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อเมนู</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="เช่น ลาเต้"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">ราคา (บาท)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="categoryId">หมวดหมู่</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.id !== "all")
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
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

            <div className="space-y-2">
              <Label>รูปภาพเมนู (ถ้ามี)</Label>
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-secondary">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Label
                    htmlFor="image"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      คลิกเพื่ออัปโหลดรูปภาพ
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      (PNG, JPG, WEBP - ไม่เกิน 5MB)
                    </span>
                  </Label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>รูปภาพสูตร (ถ้ามี)</Label>
              {recipeImagePreview ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-secondary">
                  <Image
                    src={recipeImagePreview}
                    alt="Recipe Preview"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveRecipeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="recipeImage"
                    type="file"
                    accept="image/*"
                    onChange={handleRecipeImageSelect}
                    className="hidden"
                  />
                  <Label
                    htmlFor="recipeImage"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      คลิกเพื่ออัปโหลดรูปสูตร
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      (PNG, JPG, WEBP - ไม่เกิน 5MB)
                    </span>
                  </Label>
                </div>
              )}
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
              disabled={
                !formData.name ||
                !formData.price ||
                !formData.categoryId ||
                isLoading ||
                isUploading
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังอัปโหลดรูป...
                </>
              ) : isLoading ? (
                "กำลังบันทึก..."
              ) : editingItem ? (
                "บันทึก"
              ) : (
                "เพิ่มเมนู"
              )}
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
              {confirmDialog.newStatus ? "เปิดใช้งานเมนู" : "ปิดใช้งานเมนู"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.newStatus
                ? `ต้องการเปิดใช้งานเมนู "${confirmDialog.item?.name}" หรือไม่?`
                : `ต้องการปิดใช้งานเมนู "${confirmDialog.item?.name}" หรือไม่?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleAvailability}
              className="bg-primary hover:bg-pink-hover"
              disabled={isLoading}
            >
              {isLoading ? "กำลังดำเนินการ..." : "ยืนยัน"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
