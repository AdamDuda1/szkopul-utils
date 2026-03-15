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
		popup_options_title: "Opcje",
		popup_options_hideScores: "Ukrywaj wyniki",
		popup_options_hideTimers: "Ukrywaj czasomierze",
		popup_options_exportData: "Export danych",
		popup_options_removeAllData: "Usuń wszystkie dane",

		popup_todo_title: "Do zrobienia",
		popup_todo_openFullList: "Otwórz pełną listę",

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

		popup_options_language: "Language:",
		popup_options_title: "Options",
		popup_options_hideScores: "Hide scores",
		popup_options_hideTimers: "Hide timers",
		popup_options_exportData: "Export data",
		popup_options_removeAllData: "Delete all data",

		popup_todo_title: "To-do",
		popup_todo_openFullList: "Open full list",

		menu_markAsTODO: "Mark as to-do",
		menu_addToVirtual: "Add to virtual contest",
		menu_viewNote: "View note"
	}
}