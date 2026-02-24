import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Product, MOCK_PRODUCTS } from './data';
import { Search, MousePointer2, Pencil, Trash2, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Fix Leaflet marker icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom minimalist marker - Brown color
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper to check if point is in polygon
function isPointInPolygon(point: [number, number], polygon: [number, number][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

interface MapEventsProps {
  isDrawing: boolean;
  onDrawUpdate: (points: [number, number][]) => void;
  onDrawEnd: () => void;
}

function MapEvents({ isDrawing, onDrawUpdate, onDrawEnd }: MapEventsProps) {
  const [points, setPoints] = useState<[number, number][]>([]);
  const map = useMap();

  useMapEvents({
    mousedown: (e) => {
      if (!isDrawing) return;
      map.dragging.disable();
      setPoints([[e.latlng.lat, e.latlng.lng]]);
    },
    mousemove: (e) => {
      if (!isDrawing || points.length === 0) return;
      const newPoints = [...points, [e.latlng.lat, e.latlng.lng] as [number, number]];
      setPoints(newPoints);
      onDrawUpdate(newPoints);
    },
    mouseup: () => {
      if (!isDrawing) return;
      map.dragging.enable();
      onDrawEnd();
      setPoints([]);
    }
  });

  return null;
}

export default function App() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelSearchQuery, setPanelSearchQuery] = useState('');

  const handleDrawUpdate = (points: [number, number][]) => {
    setCurrentPolygon(points);
  };

  const handleDrawEnd = () => {
    if (currentPolygon.length < 3) {
      setCurrentPolygon([]);
      return;
    }

    const found = MOCK_PRODUCTS.filter(p => isPointInPolygon([p.lat, p.lng], currentPolygon));
    setSelectedProducts(found);
    setShowResults(true);
    setIsDrawing(false);
  };

  const clearSelection = () => {
    setCurrentPolygon([]);
    setSelectedProducts([]);
    setShowResults(false);
    setPanelSearchQuery('');
  };

  const filteredPanelProducts = selectedProducts.filter(p => 
    p.name.toLowerCase().includes(panelSearchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(panelSearchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full h-full font-sans text-stone-900">
      {/* Header & Search */}
      <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col sm:flex-row items-start sm:items-center gap-4 pointer-events-none">
        <div className="bg-stone-50/95 backdrop-blur-md border border-stone-200 rounded-2xl p-4 shadow-xl pointer-events-auto flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-brown rounded-xl flex items-center justify-center text-brand-yellow">
              <Package size={20} />
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-semibold tracking-tight text-stone-800">MapDraw</h1>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest font-medium">Discovery</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-stone-200 hidden sm:block" />
          
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar produtos ou locais..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-all"
            />
          </div>
        </div>

        <div className="bg-stone-50/95 backdrop-blur-md border border-stone-200 rounded-2xl p-1 shadow-xl flex items-center gap-1 pointer-events-auto">
          <button
            onClick={() => setIsDrawing(false)}
            className={cn(
              "p-3 rounded-xl transition-all duration-200",
              !isDrawing ? "bg-brand-brown text-brand-yellow shadow-lg" : "text-stone-500 hover:bg-stone-100"
            )}
            title="Navegar"
          >
            <MousePointer2 size={18} />
          </button>
          <button
            onClick={() => setIsDrawing(true)}
            className={cn(
              "p-3 rounded-xl transition-all duration-200",
              isDrawing ? "bg-brand-brown text-brand-yellow shadow-lg" : "text-stone-500 hover:bg-stone-100"
            )}
            title="Desenhar Área"
          >
            <Pencil size={18} />
          </button>
          <div className="w-px h-6 bg-stone-200 mx-1" />
          <button
            onClick={clearSelection}
            className="p-3 rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
            title="Limpar"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className={cn("w-full h-full", isDrawing && "drawing-mode")}>
        <MapContainer
          center={[-23.5505, -46.6333]}
          zoom={15}
          zoomControl={false}
          className="w-full h-full"
        >
          {/* Normal Map Style (OpenStreetMap) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapEvents
            isDrawing={isDrawing}
            onDrawUpdate={handleDrawUpdate}
            onDrawEnd={handleDrawEnd}
          />

          {currentPolygon.length > 0 && (
            <Polygon
              positions={currentPolygon}
              pathOptions={{
                color: '#5d4037',
                fillColor: '#fff9c4',
                fillOpacity: 0.3,
                weight: 3,
                dashArray: isDrawing ? '5, 10' : undefined
              }}
            />
          )}

          {MOCK_PRODUCTS
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(product => (
            <Marker
              key={product.id}
              position={[product.lat, product.lng]}
              icon={customIcon}
            >
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Results Panel */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full sm:w-[400px] bg-stone-50/98 backdrop-blur-xl border-l border-stone-200 z-[2000] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-stone-100 bg-brand-yellow/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-stone-800">Produtos Encontrados</h2>
                  <p className="text-xs text-stone-500">{selectedProducts.length} itens na área selecionada</p>
                </div>
                <button
                  onClick={() => setShowResults(false)}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Filtrar resultados..."
                  value={panelSearchQuery}
                  onChange={(e) => setPanelSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/80 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-brown/10 focus:border-brand-brown transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredPanelProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300">
                    <Search size={32} />
                  </div>
                  <div>
                    <p className="font-medium text-stone-600">Nenhum produto encontrado</p>
                    <p className="text-sm text-slate-400">Tente mudar o filtro ou desenhar outra área.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-4 sm:gap-6">
                  {filteredPanelProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                          <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-brand-yellow/90 backdrop-blur-sm text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md border border-brand-yellow-dark/20 text-stone-700">
                            {product.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">
                        <h3 className="font-medium text-stone-900 text-xs sm:text-base truncate">{product.name}</h3>
                        <div className="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-sm sm:text-lg font-semibold text-brand-brown">
                            R$ {product.price.toLocaleString('pt-BR')}
                          </span>
                          <button className="text-[10px] sm:text-xs font-semibold text-stone-400 hover:text-brand-brown transition-colors text-left sm:text-right">
                            Detalhes
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-stone-50/50 border-t border-stone-100">
              <button
                onClick={clearSelection}
                className="w-full py-3 bg-brand-brown text-brand-yellow rounded-xl font-medium shadow-lg shadow-brand-brown/20 hover:bg-stone-800 transition-all active:scale-[0.98]"
              >
                Nova Pesquisa
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawing Hint */}
      {isDrawing && !currentPolygon.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-brand-brown text-brand-yellow px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-brand-yellow/20"
        >
          <Pencil size={16} className="animate-pulse" />
          <span className="text-sm font-medium">Clique e arraste para desenhar no mapa</span>
        </motion.div>
      )}
    </div>
  );
}

