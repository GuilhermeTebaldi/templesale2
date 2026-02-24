import React from "react";
import { motion } from "motion/react";
import { X, Heart, ExternalLink, Trash2 } from "lucide-react";
import { type Product } from "./ProductCard";

interface CurtidasProps {
  products: Product[];
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
  onRemove: (id: number) => Promise<void>;
}

export default function Curtidas({
  products,
  onClose,
  onOpenProduct,
  onRemove,
}: CurtidasProps) {
  const [removingProductId, setRemovingProductId] = React.useState<number | null>(null);

  const handleRemove = async (id: number) => {
    if (removingProductId === id) {
      return;
    }
    setRemovingProductId(id);
    try {
      await onRemove(id);
    } finally {
      setRemovingProductId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-150 bg-[#fdfcfb] flex flex-col"
    >
      <div className="p-8 flex justify-between items-center border-b border-stone-100">
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6 text-stone-800" />
          <h2 className="text-2xl font-serif tracking-widest uppercase">Curtidas</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
          <X className="w-6 h-6 text-stone-600" />
        </button>
      </div>

      <div className="grow overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-12 h-12 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400 uppercase tracking-widest text-xs">
                Você ainda não curtiu nenhum produto.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {products.map((product) => {
                const isRemoving = removingProductId === product.id;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    className="flex gap-6 p-4 bg-white border border-stone-100 rounded-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="w-24 h-32 bg-stone-100 overflow-hidden shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-serif italic text-lg text-stone-800">{product.name}</h3>
                          <span className="text-sm font-mono text-stone-900">{product.price}</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">
                          {product.category}
                        </p>
                      </div>

                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={() => onOpenProduct(product)}
                          className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-800 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver produto
                        </button>
                        <button
                          disabled={isRemoving}
                          onClick={() => {
                            void handleRemove(product.id);
                          }}
                          className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-red-500 disabled:text-stone-300 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          {isRemoving ? "Removendo..." : "Remover curtida"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
