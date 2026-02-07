"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { type MenuItem } from "@/lib/pos-types";
import { cn } from "@/lib/utils";
import { Coffee, ShoppingBag, Search, Eye, Newspaper, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RecipeModal from "./recipe-modal";

interface MenuGridProps {
  selectedCategory: string;
  onSelectItem: (item: MenuItem) => void;
  setOpenDrawer: (open: boolean) => void;
  cartItemsCount?: number;
}

interface DbMenu {
  id: string;
  name: string;
  description: string | null;
  recipe: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  isAvailable: boolean;
  category: {
    id: string;
    name: string;
  };
}

export function MenuGrid({
  selectedCategory,
  onSelectItem,
  setOpenDrawer,
  cartItemsCount = 0,
}: MenuGridProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/menu");
      if (!response.ok) throw new Error("Failed to fetch menu items");
      const data: DbMenu[] = await response.json();

      // Transform database menu to MenuItem format
      const transformedItems: MenuItem[] = data
        .filter((item) => item.isAvailable)
        .map((item) => ({
          id: item.id,
          name: item.name,
          nameEn: item.description || "",
          recipe: item.recipe || "",
          price: item.price,
          category: item.categoryId,
          image: item.imageUrl || "",
        }));

      setMenuItems(transformedItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  // Apply search filter
  const searchedItems = filteredItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
        <Coffee className="w-8 h-8 text-muted-foreground animate-pulse" />
        <p className="ml-3 text-muted-foreground">กำลังโหลดเมนู...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 pb-2 bg-background sticky top-0 z-10 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-foreground">
            เมนูเครื่องดื่ม
          </h2>
          <Button
            variant="outline"
            className="sm:hidden bg-primary px-1 relative"
            onClick={() => setOpenDrawer(true)}
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary-foreground" />
            </div>
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ค้นหาเมนู..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {searchedItems.length} รายการ
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
          {searchedItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              onClick={() => onSelectItem(item)}
            />
          ))}
        </div>

        {searchedItems.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Coffee className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "ไม่พบเมนูที่ค้นหา" : "ไม่พบเมนูในหมวดหมู่นี้"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface MenuCardProps {
  item: MenuItem;
  onClick: () => void;
}

function MenuCard({ item, onClick }: MenuCardProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          "group bg-card rounded-2xl p-3 text-left transition-all duration-200",
          "border border-border shadow-sm",
          "hover:shadow-lg hover:border-primary hover:-translate-y-1",
          "active:scale-[0.98]",
        )}
      >
        {/* Image placeholder */}
        <div className="aspect-square rounded-xl bg-secondary mb-3 flex items-center justify-center overflow-hidden relative">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <Coffee className="w-12 h-12 text-primary/40 group-hover:text-primary transition-colors" />
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-foreground text-sm leading-tight mb-0.5">
              {item.name}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailsModal(true);
              }}
            >
              <Newspaper className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{item.nameEn}</p>
          <p className="text-lg font-bold text-primary">฿{item.price}</p>
        </div>
      </button>

      <RecipeModal
        showDetailsModal={showDetailsModal}
        setShowDetailsModal={setShowDetailsModal}
        item={item}
        onClick={onClick}
      />
    </>
  );
}
