export interface DictionaryLocation {
  id: string;
  nameRo: string;
  nameRu?: string;
  active: boolean;
}

export interface DictionaryRegion {
  id: string;
  nameRo: string;
  nameRu?: string;
  active: boolean;
}

export interface Dictionaries {
  brands: string[];
  regions: string[];
  cities: string[];
}

export const INITIAL_MOLDOVA_CITIES: DictionaryLocation[] = [
  { id: "chisinau", nameRo: "Chișinău", nameRu: "Кишинёв", active: true },
  { id: "balti", nameRo: "Bălți", nameRu: "Бельцы", active: true },
  { id: "cahul", nameRo: "Cahul", active: true },
  { id: "causeni", nameRo: "Căușeni", active: true },
  { id: "comrat", nameRo: "Comrat", active: true },
  { id: "edinet", nameRo: "Edineț", active: true },
  { id: "hincesti", nameRo: "Hîncești", active: true },
  { id: "ialoveni", nameRo: "Ialoveni", active: true },
  { id: "orhei", nameRo: "Orhei", active: true },
  { id: "soroca", nameRo: "Soroca", active: true },
  { id: "straseni", nameRo: "Strășeni", active: true },
  { id: "ungheni", nameRo: "Ungheni", active: true },
  { id: "calarasi", nameRo: "Călărași", active: true },
  { id: "nisporeni", nameRo: "Nisporeni", active: true },
  { id: "riscani", nameRo: "Rîșcani", active: true },
  { id: "drochia", nameRo: "Drochia", active: true },
  { id: "floresti", nameRo: "Florești", active: true },
  { id: "falesti", nameRo: "Fălești", active: true },
  { id: "singerei", nameRo: "Sîngerei", active: true },
  { id: "rezina", nameRo: "Rezina", active: true },
  { id: "stefan_voda", nameRo: "Ștefan Vodă", active: true },
  { id: "taraclia", nameRo: "Taraclia", active: true },
  { id: "vulcanesti", nameRo: "Vulcănești", active: true },
  { id: "bender", nameRo: "Bender", nameRu: "Бендеры", active: true },
  { id: "tiraspol", nameRo: "Tiraspol", nameRu: "Тирасполь", active: true },
];

export const INITIAL_MOLDOVA_REGIONS: DictionaryRegion[] = [
  { id: "chisinau_reg", nameRo: "Chișinău", nameRu: "Кишинёв", active: true },
  { id: "centru", nameRo: "Centru", nameRu: "Центр", active: true },
  { id: "nord", nameRo: "Nord", nameRu: "Север", active: true },
  { id: "sud", nameRo: "Sud", nameRu: "Юг", active: true },
];

export const DEFAULT_DICTIONARIES: Dictionaries = {
  brands: ["Orange", "Enter", "Darwin", "Ultra", "iStore", "Moldcell", "Bomba", "Maximum"],
  regions: INITIAL_MOLDOVA_REGIONS.map((r) => (r.nameRu ? `${r.nameRo} / ${r.nameRu}` : r.nameRo)),
  cities: INITIAL_MOLDOVA_CITIES.map((c) => (c.nameRu ? `${c.nameRo} / ${c.nameRu}` : c.nameRo)),
};

const STORAGE_KEY = "okk_dictionaries_v2";

export function loadDictionaries(): Dictionaries {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        brands: Array.isArray(parsed.brands) && parsed.brands.length > 0 ? parsed.brands : DEFAULT_DICTIONARIES.brands,
        regions: Array.isArray(parsed.regions) && parsed.regions.length > 0
          ? parsed.regions.map((r: any) => typeof r === "string" ? r : getLocationDisplayName(r))
          : DEFAULT_DICTIONARIES.regions,
        cities: Array.isArray(parsed.cities) && parsed.cities.length > 0
          ? parsed.cities.map((c: any) => typeof c === "string" ? c : getLocationDisplayName(c))
          : DEFAULT_DICTIONARIES.cities,
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
  window.dispatchEvent(new CustomEvent("okk-dictionaries-updated", { detail: dicts }));
  if (checkSupabaseConnection()) {
    void getSupabase()?.from("app_dictionaries").upsert({ id: "global", payload: dicts });
  }
}

export async function loadDictionariesRemote(): Promise<Dictionaries> {
  if (!checkSupabaseConnection()) return loadDictionaries();
  const { data, error } = await getSupabase()!
    .from("app_dictionaries")
    .select("payload")
    .eq("id", "global")
    .maybeSingle();
  if (error) throw new Error(`Не удалось загрузить справочники: ${error.message}`);
  const dictionaries = data?.payload as Dictionaries | undefined;
  if (dictionaries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dictionaries));
    window.dispatchEvent(new CustomEvent("okk-dictionaries-updated", { detail: dictionaries }));
    return dictionaries;
  }
  return loadDictionaries();
}

export function getLocationDisplayName(item: string | DictionaryLocation | DictionaryRegion): string {
  if (typeof item === "string") return item;
  if (item.nameRu && item.nameRo !== item.nameRu) {
    return `${item.nameRo} / ${item.nameRu}`;
  }
  return item.nameRo;
}
import { checkSupabaseConnection, getSupabase } from "../services/supabaseClient";
