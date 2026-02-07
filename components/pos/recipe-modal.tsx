import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import Image from "next/image";
import { Button } from "../ui/button";

interface RecipeModalProps {
  showDetailsModal: boolean;
  setShowDetailsModal: (open: boolean) => void;
  item: {
    id: string;
    name: string;
    nameEn: string;
    price: number;
    recipe?: string;
  };
  onClick: () => void;
}
const recipeModal = ({
  showDetailsModal,
  setShowDetailsModal,
  item,
  onClick,
}: RecipeModalProps) => {
  return (
    <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image */}
          {item.recipe && (
            <div className="relative w-full rounded-lg overflow-scroll bg-secondary max-h-[70vh] flex items-center justify-center">
              <Image
                src={item.recipe}
                alt={item.name}
                width={800}
                height={800}
                className="object-contain w-full h-auto"
              />
            </div>
          )}

          {/* Details */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">รายละเอียด</p>
              <p className="text-base">{item.nameEn || "ไม่มีรายละเอียด"}</p>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">ราคา</p>
              <p className="text-3xl font-bold text-primary">
                ฿{item.price.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => {
              setShowDetailsModal(false);
              onClick();
            }}
            className="w-full h-12 text-base font-semibold"
          >
            เลือกเมนูนี้
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default recipeModal;
