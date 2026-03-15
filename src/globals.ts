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
		popup_home_virtual: "KONKURS WIRTUALNY",
		popup_home_todo: "ZADANIA DO ZROBIENIA",
		popup_home_options: "OPCJE",
		popup_home_refreshPls: "Odśwież stronę, aby zmiany zostały zastosowane",
		popup_home_hideScores: "Ukrywaj wyniki",

		popup_options_language: "Język:",

		menu_markAsTODO: "Oznacz jako Do Zrobienia",
		menu_addToVirtual: "Dodaj do wirtualki",
		menu_viewNote: "Zobacz notatkę"
	},
	en: {
		popup_home_virtual: "VIRTUAL CONTEST",
		popup_home_todo: "TODO TASKS",
		popup_home_options: "OPTIONS",
		popup_home_refreshPls: "Please refresh the page to apply changes",
		popup_home_hideScores: "Hide scores",

		popup_options_language: "Język:",

		menu_markAsTODO: "Mark as TODO",
		menu_addToVirtual: "Add to virtual contest",
		menu_viewNote: "View note"
	}
}