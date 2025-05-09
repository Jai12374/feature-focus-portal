
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type ProductFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  existingProduct?: {
    prodcode: string;
    description: string;
    unit: string;
  };
};

export function ProductForm({ isOpen, onClose, onSaved, existingProduct }: ProductFormProps) {
  const [prodcode, setProdcode] = useState(existingProduct?.prodcode || "");
  const [description, setDescription] = useState(existingProduct?.description || "");
  const [unit, setUnit] = useState(existingProduct?.unit || "");
  const [unitprice, setUnitprice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prodcode || !description || !unit || !unitprice) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    try {
      const product = {
        prodcode,
        description,
        unit,
      };

      // Insert or update product
      const { error: productError } = existingProduct
        ? await supabase
            .from('product')
            .update(product)
            .eq('prodcode', existingProduct.prodcode)
        : await supabase
            .from('product')
            .insert(product);

      if (productError) throw productError;

      // Insert price history entry
      const { error: priceError } = await supabase
        .from('pricehist')
        .insert({
          prodcode,
          effdate: new Date().toISOString().split('T')[0],
          unitprice: parseFloat(unitprice),
        });

      if (priceError) throw priceError;

      toast({
        title: "Success",
        description: `Product ${existingProduct ? 'updated' : 'added'} successfully`,
      });
      
      onSaved();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {existingProduct ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="prodcode" className="text-right">
              Product Code
            </label>
            <Input
              id="prodcode"
              value={prodcode}
              onChange={(e) => setProdcode(e.target.value)}
              className="col-span-3"
              disabled={!!existingProduct}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="description" className="text-right">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="unit" className="text-right">
              Unit
            </label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="col-span-3"
            />
          </div>
          {!existingProduct && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="unitprice" className="text-right">
                Initial Price
              </label>
              <Input
                id="unitprice"
                type="number"
                step="0.01"
                value={unitprice}
                onChange={(e) => setUnitprice(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {existingProduct ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
