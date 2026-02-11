"use client";

import { Button } from "@/components/ui/button";
import { type CartItem, type Member, TIER_DISCOUNTS } from "@/lib/pos-types";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  User,
  Star,
  Percent,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import RecipeModal from "./recipe-modal";
import { useState } from "react";

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  selectedMember: Member | null;
  onOpenMemberSearch: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const tierColors = {
  bronze: { bg: "bg-amber-100", text: "text-amber-700" },
  silver: { bg: "bg-gray-100", text: "text-gray-600" },
  gold: { bg: "bg-yellow-100", text: "text-yellow-700" },
  platinum: { bg: "bg-purple-100", text: "text-purple-700" },
};

const tierLabels = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export function CartPanel({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  selectedMember,
  onOpenMemberSearch,
  open,
  onOpenChange,
}: CartPanelProps) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <aside className="w-80 bg-sidebar border-l border-sidebar-border flex-col text-sidebar-foreground sm:flex hidden lg:h-[calc(100vh-100px)] sm:h-[calc(100vh-180px)]">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-sidebar-foreground">
                  ตะกร้า
                </h2>
                <p className="text-xs text-sidebar-foreground/70">
                  {itemCount} รายการ
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearCart}
                  className="text-sidebar-foreground/70 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Member Selection */}
        <div className="p-3 border-b border-sidebar-border">
          <button
            onClick={onOpenMemberSearch}
            className={cn(
              "w-full p-3 rounded-xl border-2 border-dashed transition-all",
              selectedMember
                ? `${tierColors[selectedMember.tier].bg} border-transparent`
                : "border-sidebar-border hover:border-primary/50 hover:bg-sidebar-accent",
            )}
          >
            {selectedMember ? (
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    tierColors[selectedMember.tier].bg,
                  )}
                >
                  <User
                    className={cn(
                      "w-5 h-5",
                      tierColors[selectedMember.tier].text,
                    )}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground text-sm">
                    {selectedMember.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        tierColors[selectedMember.tier].bg,
                        tierColors[selectedMember.tier].text,
                      )}
                    >
                      <Star className="w-3 h-3 inline mr-1" />
                      {tierLabels[selectedMember.tier]}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    {selectedMember.points}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70">แต้ม</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sidebar-foreground/70">
                <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-sidebar-foreground">
                    เพิ่มสมาชิก
                  </p>
                  <p className="text-xs">แตะเพื่อค้นหาหรือสแกน QR</p>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-sidebar-accent mx-auto mb-3 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-sidebar-foreground/70" />
              </div>
              <p className="text-sidebar-foreground/70 text-sm">
                ยังไม่มีรายการ
              </p>
              <p className="text-sidebar-foreground/70 text-xs">
                เลือกเมนูเพื่อเริ่มต้น
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))
          )}
        </div>

        {/* Summary */}
        <div className="p-4 border-t border-sidebar-border space-y-3 flex-shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-sidebar-foreground/70">รายการ</span>
              <span className="text-sidebar-foreground">{itemCount} แก้ว</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sidebar-foreground/70">ราคารวม</span>
              <span className="text-sidebar-foreground">
                ฿{subtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-sidebar-border">
              <span className="font-medium text-sidebar-foreground">
                ยอดสุทธิ
              </span>
              <span className="text-2xl font-bold text-primary">
                ฿{subtotal.toLocaleString()}
              </span>
            </div>
          </div>

          <Button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg"
          >
            ชำระเงิน
          </Button>
        </div>
      </aside>
      <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-w-sm h-screen">
          <aside className="bg-sidebar border-l border-sidebar-border flex flex-col text-sidebar-foreground h-full">
            {/* Header */}
            <div className="p-4 border-b border-sidebar-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sidebar-foreground">
                      ตะกร้า
                    </h2>
                    <p className="text-xs text-sidebar-foreground/70">
                      {itemCount} รายการ
                    </p>
                  </div>
                </div>
                {items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearCart}
                    className="text-sidebar-foreground/70 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Member Selection */}
            <div className="p-3 border-b border-sidebar-border">
              <button
                onClick={onOpenMemberSearch}
                className={cn(
                  "w-full p-3 rounded-xl border-2 border-dashed transition-all",
                  selectedMember
                    ? `${tierColors[selectedMember.tier].bg} border-transparent`
                    : "border-sidebar-border hover:border-primary/50 hover:bg-sidebar-accent",
                )}
              >
                {selectedMember ? (
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        tierColors[selectedMember.tier].bg,
                      )}
                    >
                      <User
                        className={cn(
                          "w-5 h-5",
                          tierColors[selectedMember.tier].text,
                        )}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground text-sm">
                        {selectedMember.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            tierColors[selectedMember.tier].bg,
                            tierColors[selectedMember.tier].text,
                          )}
                        >
                          <Star className="w-3 h-3 inline mr-1" />
                          {tierLabels[selectedMember.tier]}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        {selectedMember.points}
                      </p>
                      <p className="text-xs text-sidebar-foreground/70">แต้ม</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sidebar-foreground/70">
                    <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-sidebar-foreground">
                        เพิ่มสมาชิก
                      </p>
                      <p className="text-xs">แตะเพื่อค้นหาหรือสแกน QR</p>
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-sidebar-accent mx-auto mb-3 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-sidebar-foreground/70" />
                  </div>
                  <p className="text-sidebar-foreground/70 text-sm">
                    ยังไม่มีรายการ
                  </p>
                  <p className="text-sidebar-foreground/70 text-xs">
                    เลือกเมนูเพื่อเริ่มต้น
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemoveItem}
                  />
                ))
              )}
            </div>

            {/* Summary */}
            <div className="p-4 border-t border-sidebar-border space-y-3 flex-shrink-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-sidebar-foreground/70">รายการ</span>
                  <span className="text-sidebar-foreground">
                    {itemCount} แก้ว
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sidebar-foreground/70">ราคารวม</span>
                  <span className="text-sidebar-foreground">
                    ฿{subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-sidebar-border">
                  <span className="font-medium text-sidebar-foreground">
                    ยอดสุทธิ
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    ฿{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={onCheckout}
                disabled={items.length === 0}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg"
              >
                ชำระเงิน
              </Button>
            </div>
          </aside>
        </DrawerContent>
      </Drawer>
    </>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemove: (itemId: string) => void;
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const toppingsText = item.toppings.map((t) => t.name).join(", ");
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return (
    <div className="bg-card rounded-xl p-3 shadow-sm border border-border">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-foreground text-sm">
            {item.menuItem.name}
          </h4>
          <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
            {/* <span className="bg-secondary px-1.5 py-0.5 rounded">{item.size}</span> */}
            <span className="bg-secondary px-1.5 py-0.5 rounded">
              {item.sweetness}
            </span>
            {/* <span className="bg-secondary px-1.5 py-0.5 rounded">{item.ice}</span> */}
          </div>
          {toppingsText && (
            <p className="text-xs text-muted-foreground mt-1">
              + {toppingsText}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/70 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetailsModal(true);
            }}
          >
            <Newspaper className="w-4 h-4" />
          </Button>
        </div>
        <RecipeModal
          showDetailsModal={showDetailsModal}
          setShowDetailsModal={setShowDetailsModal}
          item={item.menuItem}
          onClick={() => {}}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.id, -1)}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
              "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center font-medium text-foreground">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
              "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <span className="font-semibold text-primary">฿{item.totalPrice}</span>
      </div>
    </div>
  );
}
