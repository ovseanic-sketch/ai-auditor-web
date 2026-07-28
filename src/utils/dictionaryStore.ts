export interface Dictionaries {
  brands: string[];
  regions: string[];
  cities: string[];
}

export const DEFAULT_DICTIONARIES: Dictionaries = {
  brands: ["Orange", "Enter", "Darwin", "Ultra", "iStore", "Moldcell", "Bomba", "Maximum"],
  regions: [
    "Кишинёв",
    "Северный регион (Бельцы)",
    "Южный регион (Кагул)",
    "Центральный регион (Орхей)",
    "Гагаузия (Комрат)",
    "Приднестровье (Тирасполь)",
  ],
  cities: [
    "Кишинёв",
    "Бельцы",
    "Бендеры",
    "Тирасполь",
    "Кагул",
    "Комрат",
    "Орхей",
    "Унгены",
    "Сороки",
    "Дубоссары",
    "Чадыр-Лунга",
    "Единец",
    "Каушаны",
    "Хынчешты",
    "Фалешты",
    "Рышканы",
    "Дрокия",
    "Окница",
  ],
};

const STORAGE_KEY = "okk_dictionaries_v2";

export function loadDictionaries(): Dictionaries {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        brands: Array.isArray(parsed.brands) && parsed.brands.length > 0 ? parsed.brands : DEFAULT_DICTIONARIES.brands,
        regions: Array.isArray(parsed.regions) && parsed.regions.length > 0 ? parsed.regions : DEFAULT_DICTIONARIES.regions,
        cities: Array.isArray(parsed.cities) && parsed.cities.length > 0 ? parsed.cities : DEFAULT_DICTIONARIES.cities,
      };
    }
  } catch (e) {
    console.error("Failed to load dictionaries from localStorage", e);
  }
  return DEFAULT_DICTIONARIES;
}

export function saveDictionaries(dicts: Dictionaries): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dicts));
  } catch (e) {
    console.error("Failed to save dictionaries to localStorage", e);
  }
}
