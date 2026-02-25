import { type AppLocale } from "./index";

const categories = [
  "Imóveis",
  "Terreno",
  "Aluguel",
  "Veículos",
  "Eletrônicos e Celulares",
  "Informática e Games",
  "Casa, Móveis e Decoração",
  "Eletrodomésticos",
  "Moda e Acessórios",
  "Beleza e Saúde",
  "Bebês e Crianças",
  "Esportes e Lazer",
  "Hobbies e Colecionáveis",
  "Antiguidades",
  "Livros, Papelaria e Cursos",
  "Instrumentos Musicais",
  "Ferramentas e Construção",
  "Jardim e Pet",
  "Serviços",
  "Empregos",
  "Outros",
] as const;

export type CategoryKey = (typeof categories)[number];
export const CATEGORY_VALUES: CategoryKey[] = [...categories];

const itCategoryLabels: Record<CategoryKey, string> = {
  "Imóveis": "Immobili",
  "Terreno": "Terreno",
  "Aluguel": "Affitto",
  "Veículos": "Veicoli",
  "Eletrônicos e Celulares": "Elettronica e Cellulari",
  "Informática e Games": "Informatica e Games",
  "Casa, Móveis e Decoração": "Casa, Arredi e Decorazione",
  "Eletrodomésticos": "Elettrodomestici",
  "Moda e Acessórios": "Moda e Accessori",
  "Beleza e Saúde": "Bellezza e Salute",
  "Bebês e Crianças": "Bebè e Bambini",
  "Esportes e Lazer": "Sport e Tempo libero",
  "Hobbies e Colecionáveis": "Hobby e Collezionabili",
  "Antiguidades": "Antichità",
  "Livros, Papelaria e Cursos": "Libri, Cancelleria e Corsi",
  "Instrumentos Musicais": "Strumenti musicali",
  "Ferramentas e Construção": "Utensili e Costruzione",
  "Jardim e Pet": "Giardino e Animali",
  "Serviços": "Servizi",
  "Empregos": "Lavoro",
  "Outros": "Altro",
};

export function getCategoryLabel(value: string, locale: AppLocale): string {
  if (locale === "it-IT") {
    return itCategoryLabels[value as CategoryKey] ?? value;
  }
  return value;
}
