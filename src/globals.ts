let currentLang: lang = "pl";
export type lang = "en" | "pl";

export function setLang(lang: lang) { currentLang = lang; }
export function t(key: keyof typeof translations["pl"]) { return translations[currentLang][key]; }

export const translations = {
	pl: {
		popup_home_virtual: "Konkurs wirtualny",
		popup_home_todo: "Zadania do zrobienia",
		popup_home_options: "Opcje",
		popup_home_refreshPls: "Odśwież stronę, aby zmiany zostały zastosowane",
		popup_home_hideScores: "Ukryj wyniki",

		popup_options_language: "Język:",

		menu_markAsTODO: "Oznacz jako 'Do zrobienia'",
		menu_addToVirtual: "Dodaj do konkursu wirtualnego",
		menu_viewNote: "Zobacz notatkę"
	},
	en: {
		popup_home_virtual: "Virtual contest",
		popup_home_todo: "To-do tasks",
		popup_home_options: "Options",
		popup_home_refreshPls: "Please refresh the page to apply changes",
		popup_home_hideScores: "Hide scores",

		popup_options_language: "Język:",

		menu_markAsTODO: "Mark as to-do",
		menu_addToVirtual: "Add to virtual contest",
		menu_viewNote: "View note"
	}
}