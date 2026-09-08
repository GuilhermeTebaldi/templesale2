import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { Company, Post } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company;
  onPublish: (post: Omit<Post, 'id' | 'createdAt' | 'comments'>) => void;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    label: 'Balcão & Bebidas',
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&auto=format&fit=crop&q=80',
  },
  {
    label: 'Prato / Pizza no Forno',
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&auto=format&fit=crop&q=80',
  },
  {
    label: 'Mecânica & Motor',
    url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=900&auto=format&fit=crop&q=80',
  },
  {
    label: 'Corte de Barba / Cabelo',
    url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=900&auto=format&fit=crop&q=80',
  },
  {
    label: 'Ambiente & Fachada',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&auto=format&fit=crop&q=80',
  },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  activeCompany,
  onPublish,
}) => {
  const [step, setStep] = useState<'select-source' | 'preview-and-caption'>('select-source');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
          setStep('preview-and-caption');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    setSelectedImage(url);
    setStep('preview-and-caption');
  };

  const handlePublish = () => {
    if (!selectedImage.trim()) return;
    setIsPublishing(true);

    setTimeout(() => {
      onPublish({
        companyId: activeCompany.id,
        imageUrl: selectedImage,
        caption: caption.trim() || 'Nova publicação de nossa empresa.',
        likesCount: 1,
      });

      setIsPublishing(false);
      // Reset
      setSelectedImage('');
      setCaption('');
      setStep('select-source');
      onClose();
    }, 400);
  };

  const handleReset = () => {
    setSelectedImage('');
    setCaption('');
    setStep('select-source');
  };

  return (
    <div
      id="modal-create-post-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-create-post-container"
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-semibold text-base text-neutral-100">
              {step === 'select-source' ? '+ Publicar no TempleSale' : 'Foto e Legenda'}
            </h3>
          </div>
          <button
            id="btn-close-create-post"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative minimal flow indicator */}
        <div className="bg-neutral-950/60 px-5 py-2.5 border-b border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={activeCompany.logo}
              alt={activeCompany.name}
              className="w-5 h-5 rounded-full object-cover border border-neutral-700"
            />
            <span className="font-medium text-neutral-300 truncate max-w-[200px]">
              {activeCompany.name}
            </span>
          </div>
          <span className="text-[11px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
            Sem preço • Sem estoque • Sem carrinho
          </span>
        </div>

        {/* Step 1: Camera or Gallery Selection */}
        {step === 'select-source' && (
          <div className="p-6 space-y-6">
            <p className="text-sm text-neutral-300 text-center">
              Mostre seu trabalho, serviços, ambiente ou novidades através de uma foto.
            </p>

            {/* Hidden native inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                id="btn-open-camera"
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 hover:border-neutral-600 rounded-xl cursor-pointer transition-all group active:scale-98"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-700/60 group-hover:bg-neutral-700 flex items-center justify-center mb-3 text-neutral-200 group-hover:text-white transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm text-neutral-200">Câmera</span>
                <span className="text-xs text-neutral-400 mt-1">Tirar foto agora</span>
              </button>

              <button
                id="btn-open-gallery"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 hover:border-neutral-600 rounded-xl cursor-pointer transition-all group active:scale-98"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-700/60 group-hover:bg-neutral-700 flex items-center justify-center mb-3 text-neutral-200 group-hover:text-white transition-colors">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm text-neutral-200">Galeria</span>
                <span className="text-xs text-neutral-400 mt-1">Escolher do dispositivo</span>
              </button>
            </div>

            {/* Or quick samples */}
            <div className="border-t border-neutral-800 pt-4">
              <div className="flex items-center space-x-1.5 text-xs text-neutral-400 mb-3 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Ou selecione uma foto de exemplo para testar:</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {SAMPLE_PHOTO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-neutral-700/80 hover:border-emerald-500 group transition-all"
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Photo Preview + Caption + Publish */}
        {step === 'preview-and-caption' && (
          <div className="p-6 space-y-4">
            {/* Image Preview */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black border border-neutral-800">
              <img
                src={selectedImage}
                alt="Prévia da foto"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleReset}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-xs transition-colors"
              >
                Trocar Foto
              </button>
            </div>

            {/* Caption Input */}
            <div>
              <label
                htmlFor="post-caption-input"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                Legenda da publicação
              </label>
              <textarea
                id="post-caption-input"
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Conte sobre o serviço realizado, prato do dia, novidade do ambiente ou detalhes do trabalho..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400 transition-colors resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-1/3 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
              >
                Voltar
              </button>
              <button
                id="btn-confirm-publish"
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-2/3 py-2.5 px-4 bg-neutral-100 hover:bg-white text-neutral-950 font-semibold rounded-xl text-sm transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2"
              >
                {isPublishing ? (
                  <span>Publicando...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Publicar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
