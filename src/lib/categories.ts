export const CATEGORIES = ["محلية", "اقتصاد", "منوعات", "رياضة", "مقالات"] as const;

export type Category = (typeof CATEGORIES)[number];

export const DEFAULT_CATEGORY: Category = "محلية";

export const ALL_LABEL = "الرئيسية";
