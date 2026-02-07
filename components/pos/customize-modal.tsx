"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  type MenuItem,
  type Size,
  type Sweetness,
  type Ice,
  type Topping,
  sizeOptions,
  sweetnessOptions,
  iceOptions,
} from "@/lib/pos-types";
import { cn } from "@/lib/utils";
import { Coffee, Minus, Plus, X } from "lucide-react";

interface CustomizeModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (config: {
    menuItem: MenuItem;
    size: Size;
    sweetness: Sweetness;
    ice: Ice;
    toppings: Topping[];
    quantity: number;
    totalPrice: number;
  }) => void;
}

interface DbTopping {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export function CustomizeModal({
  item,
  open,
  onClose,
  onAddToCart,
}: CustomizeModalProps) {
  const [size, setSize] = useState<Size>("M");
  const [sweetness, setSweetness] = useState<Sweetness>("100%");
  const [ice, setIce] = useState<Ice>("ปกติ");
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [isLoadingToppings, setIsLoadingToppings] = useState(true);

  useEffect(() => {
    fetchToppings();
  }, []);

  const fetchToppings = async () => {
    try {
      setIsLoadingToppings(true);
      const response = await fetch("/api/topping");
      if (!response.ok) throw new Error("Failed to fetch toppings");
      const data: DbTopping[] = await response.json();

      // Transform database toppings to Topping format
      const transformedToppings: Topping[] = data
        .filter((topping) => topping.isAvailable)
        .map((topping) => ({
          id: topping.id,
          name: topping.name,
          price: topping.price,
        }));

      setToppings(transformedToppings);
    } catch (error) {
      console.error("Error fetching toppings:", error);
      setToppings([]);
    } finally {
      setIsLoadingToppings(false);
    }
  };

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    return (item.price + toppingsPrice) * quantity;
  }, [item, selectedToppings, quantity]);

  const handleToggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) =>
      prev.find((t) => t.id === topping.id)
        ? prev.filter((t) => t.id !== topping.id)
        : [...prev, topping],
    );
  };

  const handleAddToCart = () => {
    if (!item) return;
    onAddToCart({
      menuItem: item,
      size,
      sweetness,
      ice,
      toppings: selectedToppings,
      quantity,
      totalPrice,
    });
    // Reset state
    setSize("M");
    setSweetness("100%");
    setIce("ปกติ");
    setSelectedToppings([]);
    setQuantity(1);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border-border max-h-[90vh] flex flex-col">
        {/* Header with Image */}
        <div className="relative bg-secondary p-6 flex items-center justify-center flex-shrink-0">
          <div className="w-32 h-32 rounded-full bg-card flex items-center justify-center shadow-lg">
            <Coffee className="w-16 h-16 text-primary" />
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-bold text-foreground">
              {item.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </DialogHeader>

          {/* Size Selection */}
          {/* <div>
            <h4 className="font-medium text-foreground mb-2">ขนาด</h4>
            <div className="flex gap-2">
              {sizeOptions.map((option) => (
                <button
                  key={option.size}
                  onClick={() => setSize(option.size)}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all",
                    size === option.size
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-foreground hover:bg-accent"
                  )}
                >
                  <span className="block font-semibold">{option.size}</span>
                  <span className="text-xs opacity-80">{option.label}</span>
                  {option.priceAdd > 0 && (
                    <span className="block text-xs mt-0.5">+฿{option.priceAdd}</span>
                  )}
                </button>
              ))}
            </div>
          </div> */}

          {/* Sweetness Selection */}
          <div>
            <h4 className="font-medium text-foreground mb-2">ความหวาน</h4>
            <div className="flex gap-2 flex-wrap">
              {sweetnessOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSweetness(option)}
                  className={cn(
                    "py-2 px-4 rounded-full font-medium text-sm transition-all",
                    sweetness === option
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-foreground hover:bg-accent",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Ice Selection */}
          {/* <div>
            <h4 className="font-medium text-foreground mb-2">น้ำแข็ง</h4>
            <div className="flex gap-2 flex-wrap">
              {iceOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setIce(option)}
                  className={cn(
                    "py-2 px-4 rounded-full font-medium text-sm transition-all",
                    ice === option
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-foreground hover:bg-accent",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div> */}

          {/* Toppings */}
          <div>
            <h4 className="font-medium text-foreground mb-2">ท็อปปิ้ง</h4>
            {isLoadingToppings ? (
              <div className="flex items-center justify-center py-4">
                <Coffee className="w-5 h-5 text-muted-foreground animate-pulse" />
                <p className="ml-2 text-sm text-muted-foreground">
                  กำลังโหลด...
                </p>
              </div>
            ) : toppings.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {toppings.map((topping) => {
                  const isSelected = selectedToppings.some(
                    (t) => t.id === topping.id,
                  );
                  return (
                    <button
                      key={topping.id}
                      onClick={() => handleToggleTopping(topping)}
                      className={cn(
                        "flex items-center justify-between py-2.5 px-3 rounded-xl text-sm transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-secondary text-foreground hover:bg-accent",
                      )}
                    >
                      <span>{topping.name}</span>
                      <span className="font-medium">+฿{topping.price}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                ไม่มีท็อปปิ้ง
              </p>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-lg text-foreground">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg"
            >
              เพิ่ม ฿{totalPrice.toLocaleString()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
