import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Building2, Save, ShieldCheck, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Company, Auth0User } from '../types';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  user: Auth0User;
  onSaveCompany: (updatedCompany: Company) => void;
  onUpdateUser?: (updatedUser: Auth0User) => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  user,
  onSaveCompany,
}) => {
  const [formData, setFormData] = useState<Company>({ ...company });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    setFormData({ ...company });
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !formData.keywords.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, trimmed],
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((kw) => kw !== kwToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompany(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        id="modal-company-container"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden"
      >
        {/* Top Header Bar - Full Screen & Mobile Optimized */}
        <div className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              id="btn-close-edit-company"
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
              title="Voltar / Fechar"
            >
              <ArrowLeft className="w-5 h-5 sm:hidden" />
              <X className="w-5 h-5 hidden sm:block" />
            </button>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-neutral-300 hidden xs:block" />
              <div>
                <h2 className="font-bold text-base sm:text-lg text-neutral-100 leading-tight">
                  Editar Perfil
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Dados da Empresa no TempleSale
                </p>
              </div>
            </div>
          </div>

          {/* Quick Save in Top Bar */}
          <button
            id="btn-top-save-company"
            type="submit"
            form="form-edit-company"
            className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>

        {/* Auth0 status banner */}
        <div className="px-4 sm:px-8 py-2.5 bg-neutral-900/70 border-b border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center space-x-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Autenticado via <strong>Auth0</strong> ({user.email})
            </span>
          </div>
          <span className="text-[11px] bg-neutral-800/80 px-2 py-0.5 rounded-full text-neutral-300 font-mono shrink-0 ml-2">
            ID: {user.sub?.slice(0, 12)}...
          </span>
        </div>

        {/* Form Body - Full Screen Scrolling */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-8 py-6">
          <form
            id="form-edit-company"
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto space-y-6 pb-24 sm:pb-16"
          >
            {/* Logo / Foto da Empresa */}
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
              <label className="block text-xs font-semibold text-neutral-300 mb-2.5">
                Logo / Foto da Empresa (URL)
              </label>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    src={
                      formData.logo ||
                      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120'
                    }
                    alt="Logo preview"
                    className="w-20 h-20 rounded-2xl object-cover border border-neutral-700 shadow-md bg-neutral-950"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-neutral-900 border border-neutral-700 rounded-full text-neutral-300">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="w-full flex-1">
                  <input
                    id="input-company-logo"
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    required
                    placeholder="https://exemplo.com/foto-empresa.jpg"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
                  />
                  <span className="block text-[11px] text-neutral-400 mt-1.5">
                    Insira o link direto da imagem que representará o seu perfil.
                  </span>
                </div>
              </div>
            </div>

            {/* Nome da Empresa */}
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nome da Empresa *
              </label>
              <input
                id="input-company-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Ex: Bar & Birroteca Antica Ardea"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
              />
            </div>

            {/* Categoria & Cidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Categoria *
                </label>
                <input
                  id="input-company-category"
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Bar & Choperia, Pizzaria, Barbearia..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
                />
              </div>

              <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Cidade *
                </label>
                <input
                  id="input-company-city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Ardea, Roma, São Paulo..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Descrição da Empresa
              </label>
              <textarea
                id="textarea-company-description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Fale brevemente sobre sua empresa, serviços, ambiente ou diferenciais..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400 resize-none leading-relaxed"
              />
            </div>

            {/* WhatsApp & Horários */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  WhatsApp (para contato direto) *
                </label>
                <input
                  id="input-company-whatsapp"
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: +39 06 9138 4501"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
                />
              </div>

              <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Horários de Funcionamento *
                </label>
                <input
                  id="input-company-hours"
                  type="text"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Ter - Dom: 17:00 às 01:00"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
                />
              </div>
            </div>

            {/* Endereço / Mapa */}
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Endereço / Localização (Mapa)
              </label>
              <input
                id="input-company-address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="Ex: Via Laurentina 142, 00040 Ardea RM, Itália"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
              />
            </div>

            {/* Palavras-chave */}
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Palavras-chave (busca de empresas)
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  id="input-company-keyword"
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="Ex: bar, pizza, barbeiro, birra, motor..."
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
                />
                <button
                  id="btn-add-keyword"
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {formData.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center space-x-1.5 bg-neutral-800 text-neutral-200 text-xs px-3 py-1.5 rounded-lg border border-neutral-700/80"
                  >
                    <span>#{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                      title={`Remover #${kw}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Bottom Action Bar - Sticky for Mobile & Desktop Ergonomics */}
        <div className="sticky bottom-0 z-30 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sm:justify-end space-x-3">
          <button
            id="btn-bottom-cancel-company"
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer text-center"
          >
            Cancelar
          </button>
          <button
            id="btn-bottom-save-company"
            type="submit"
            form="form-edit-company"
            className="flex-1 sm:flex-none px-6 py-2.5 bg-neutral-100 hover:bg-white text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2 cursor-pointer text-center"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Dados da Empresa</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

