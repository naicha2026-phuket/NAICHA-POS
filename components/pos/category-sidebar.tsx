"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { type Category } from "@/lib/pos-types";
import {
  Coffee,
  Leaf,
  Milk,
  Sparkles,
  Grid3X3,
  GlassWater,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  grid: Grid3X3,
  coffee: Coffee,
  leaf: Leaf,
  milk: Milk,
  blend: GlassWater,
  star: Sparkles,
};

interface CategorySidebarProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

interface DbCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/category");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data: DbCategory[] = await response.json();

      // Transform database categories to Category format with icons
      const allCategory: Category = {
        id: "all",
        name: "ทั้งหมด",
        icon: "grid",
      };

      const transformedCategories: Category[] = [
        allCategory,
        ...data.map((cat, index) => ({
          id: cat.id,
          name: cat.name,
          icon: getIconForIndex(index),
        })),
      ];

      setCategories(transformedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Set default "all" category on error
      setCategories([{ id: "all", name: "ทั้งหมด", icon: "grid" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Assign icons cyclically based on index
  const getIconForIndex = (index: number): string => {
    const icons = ["coffee", "leaf", "milk", "blend", "star"];
    return icons[index % icons.length];
  };

  if (isLoading) {
    return (
      <aside className="w-24 bg-card border-r border-border flex flex-col py-4 gap-2">
        <h2 className="px-3 text-xs font-medium text-muted-foreground mb-2">
          หมวดหมู่
        </h2>
        <div className="flex flex-col items-center py-3 px-2 mx-2">
          <Grid3X3 className="w-5 h-5 text-muted-foreground animate-pulse" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-24 bg-card border-r border-border flex flex-col py-4 gap-2">
      <h2 className="px-3 text-xs font-medium text-muted-foreground mb-2">
        หมวดหมู่
      </h2>
      {categories.map((category) => {
        const Icon = iconMap[category.icon] || Grid3X3;
        const isSelected = selectedCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 py-3 px-2 mx-2 rounded-xl transition-all duration-200",
              isSelected
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isSelected ? "bg-primary-foreground/20" : "bg-secondary",
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">{category.name}</span>
          </button>
        );
      })}
    </aside>
  );
}
