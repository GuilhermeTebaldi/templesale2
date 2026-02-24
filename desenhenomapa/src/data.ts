export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  lat: number;
  lng: number;
  image: string;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Cadeira Minimalista",
    category: "Móveis",
    price: 450,
    lat: -23.5505,
    lng: -46.6333,
    image: "https://picsum.photos/seed/chair/400/300",
  },
  {
    id: "2",
    name: "Lâmpada de Mesa",
    category: "Iluminação",
    price: 120,
    lat: -23.5555,
    lng: -46.6353,
    image: "https://picsum.photos/seed/lamp/400/300",
  },
  {
    id: "3",
    name: "Vaso de Cerâmica",
    category: "Decoração",
    price: 85,
    lat: -23.5485,
    lng: -46.6303,
    image: "https://picsum.photos/seed/vase/400/300",
  },
  {
    id: "4",
    name: "Quadro Abstrato",
    category: "Arte",
    price: 320,
    lat: -23.5605,
    lng: -46.6403,
    image: "https://picsum.photos/seed/art/400/300",
  },
  {
    id: "5",
    name: "Cafeteira Express",
    category: "Eletro",
    price: 890,
    lat: -23.5455,
    lng: -46.6253,
    image: "https://picsum.photos/seed/coffee/400/300",
  },
  {
    id: "6",
    name: "Mesa de Jantar",
    category: "Móveis",
    price: 1200,
    lat: -23.5525,
    lng: -46.6383,
    image: "https://picsum.photos/seed/table/400/300",
  },
  {
    id: "7",
    name: "Almofada Velvet",
    category: "Decoração",
    price: 45,
    lat: -23.5585,
    lng: -46.6323,
    image: "https://picsum.photos/seed/pillow/400/300",
  },
  {
    id: "8",
    name: "Relógio de Parede",
    category: "Decoração",
    price: 150,
    lat: -23.5535,
    lng: -46.6283,
    image: "https://picsum.photos/seed/clock/400/300",
  }
];
