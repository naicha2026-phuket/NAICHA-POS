"use client";

import { useState, useCallback } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LoginScreen } from "@/components/pos/login-screen";
import { POSHeader } from "@/components/pos/pos-header";
import { CategorySidebar } from "@/components/pos/category-sidebar";
import { MenuGrid } from "@/components/pos/menu-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { CustomizeModal } from "@/components/pos/customize-modal";
import { PaymentModal } from "@/components/pos/payment-modal";
import { MemberSearchModal } from "@/components/pos/member-search-modal";
import {
  type MenuItem,
  type CartItem,
  type Size,
  type Sweetness,
  type Ice,
  type Topping,
  type Member,
  TIER_DISCOUNTS,
} from "@/lib/pos-types";

function POSContent() {
  const { employee } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isMemberSearchOpen, setIsMemberSearchOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
    setIsCustomizeOpen(true);
  };

  const handleAddToCart = useCallback(
    (config: {
      menuItem: MenuItem;
      size: Size;
      sweetness: Sweetness;
      ice: Ice;
      toppings: Topping[];
      quantity: number;
      totalPrice: number;
    }) => {
      const newItem: CartItem = {
        id: `${config.menuItem.id}-${Date.now()}`,
        menuItem: config.menuItem,
        quantity: config.quantity,
        size: config.size,
        sweetness: config.sweetness,
        ice: config.ice,
        toppings: config.toppings,
        totalPrice: config.totalPrice,
      };

      setCartItems((prev) => [...prev, newItem]);
      setIsCustomizeOpen(false);
      setSelectedItem(null);
    },
    [],
  );

  const handleUpdateQuantity = useCallback((itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== itemId) return item;
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return item;
          const pricePerUnit = item.totalPrice / item.quantity;
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: pricePerUnit * newQuantity,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      setIsPaymentOpen(true);
    }
  };

  const handlePaymentComplete = () => {
    setCartItems([]);
    setSelectedMember(null);
    setIsPaymentOpen(false);
  };

  const handleSelectMember = (member: Member | null) => {
    setSelectedMember(member);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Show login screen if not logged in
  if (!employee) {
    return <LoginScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <POSHeader />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <CategorySidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Menu Grid */}
        <MenuGrid
          selectedCategory={selectedCategory}
          onSelectItem={handleSelectItem}
          setOpenDrawer={setOpenDrawer}
          cartItemsCount={cartItems.reduce(
            (sum, item) => sum + item.quantity,
            0,
          )}
        />

        {/* Cart Panel */}
        <CartPanel
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          selectedMember={selectedMember}
          onOpenMemberSearch={() => setIsMemberSearchOpen(true)}
          open={openDrawer}
          onOpenChange={setOpenDrawer}
        />
      </div>

      {/* Customize Modal */}
      <CustomizeModal
        item={selectedItem}
        open={isCustomizeOpen}
        onClose={() => {
          setIsCustomizeOpen(false);
          setSelectedItem(null);
        }}
        onAddToCart={handleAddToCart}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={subtotal}
        items={cartItems}
        onComplete={handlePaymentComplete}
        selectedMember={selectedMember}
      />

      {/* Member Search Modal */}
      <MemberSearchModal
        open={isMemberSearchOpen}
        onClose={() => setIsMemberSearchOpen(false)}
        onSelectMember={handleSelectMember}
        selectedMember={selectedMember}
      />
    </div>
  );
}

export default function POSPage() {
  return (
    <AuthProvider>
      <POSContent />
    </AuthProvider>
  );
}
