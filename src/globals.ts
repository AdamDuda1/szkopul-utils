let currentLang: lang = "pl";
export type lang = "en" | "pl";

export function setLang(lang: lang) { currentLang = lang; }
export function t(key: keyof typeof translations["pl"]) { return translations[currentLang][key]; }

// export function t(path: string): string {
// 	const parts = path.split(".");
// 	let obj: any = translations[currentLang];
//
// 	for (const part of parts) {
// 		obj = obj?.[part];
// 	}
//
// 	return obj ?? path;
// }

export const translations = {
	pl: {
		menu_markAsTODO: "Oznacz jako Do Zrobienia",
		menu_addToVirtual: "Dodaj do wirtualki",
		menu_viewNote: "Zobacz notatkę"
	},
	en: {
		menu_markAsTODO: "Mark as TODO",
		menu_addToVirtual: "Add to virtual contest",
		menu_viewNote: "View note"
	}
}