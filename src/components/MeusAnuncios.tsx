import React from "react";
import { motion } from "motion/react";
import { X, Package, Edit2, Trash2, ExternalLink } from "lucide-react";
import { type Product } from "./ProductCard";

interface MeusAnunciosProps {
  products: Product[];
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => Promise<void>;
}

export default function MeusAnuncios({ products, onClose, onEdit, onDelete }: MeusAnunciosProps) {
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleDelete = async (id: number) => {
    if (deletingId === id) {
      return;
    }

    const confirmed = window.confirm("Tem certeza que deseja excluir este anúncio?");
    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao excluir o anúncio.";
      setErrorMessage(message);
    } finally {
      setDeletingId(null);
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
          <Package className="w-6 h-6 text-stone-800" />
          <h2 className="text-2xl font-serif tracking-widest uppercase">Meus Anúncios</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
          <X className="w-6 h-6 text-stone-600" />
        </button>
      </div>

      <div className="grow overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {errorMessage && (
            <p className="mb-6 text-sm text-red-500">{errorMessage}</p>
          )}

          {products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400 uppercase tracking-widest text-xs">Você ainda não possui anúncios.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {products.map((product) => (
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
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">{product.category}</p>
                    </div>

                    <div className="flex gap-4 mt-4">
                      <button 
                        onClick={() => onEdit(product)}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-800 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </button>
                      <button 
                        disabled={deletingId === product.id}
                        onClick={() => {
                          void handleDelete(product.id);
                        }}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-red-500 disabled:text-stone-300 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        {deletingId === product.id ? "Excluindo..." : "Excluir"}
                      </button>
                      <button className="ml-auto text-stone-300 hover:text-stone-800 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
