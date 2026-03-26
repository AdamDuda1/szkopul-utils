export const DEBUG = false;

export type task = {
	id: string,
	name: string
};

export type contest = {
	name: string,
	slug: string,
	href: string,
};

let currentLang: lang = 'pl';
export type lang = 'en' | 'pl';

export function setLang(lang: lang) { currentLang = lang; }

export function t(key: keyof typeof translations['pl']) { return translations[currentLang][key]; }

export const translations = {
	pl: {
		popup_home_virtual: 'Konkurs wirtualny',
		popup_home_todo: 'Zadania do zrobienia',
		popup_home_options: 'Opcje',
		popup_home_refreshPls: 'Zapisano, odśwież stronę, aby zmiany zostały zastosowane',

		popup_home_szkopulStatusUpFor: 'Szkopuł działa już od',
		popup_home_szkopulStatusRecordUptime: 'Rekordowy uptime to',
		popup_home_szkopulStatusMore: 'z czywyjebalohomika.xyz, @lcd.101',

		popup_home_hideScores: 'Ukryj wyniki',
		dashboard_stats_lastMonth: 'rozwiązanych w ostatnim miesiącu',
		dashboard_stats_today: 'rozwiązanych dzisiaj',
		dashboard_stats_total: 'rozwiązanych łącznie',
		dashboard_stats_chars: 'wysłanych znaków',
		dashboard_stats_bestDay: 'najlepszy dzień',
		dashboard_randomTask: 'Losowe zadanie',
		dashboard_randomTaskTODO: 'Losowe zadanie z TODO',
		dashboard_seeStats: 'Zobacz staty',
		dashboard_noRandomTask: 'Brak zadań do losowania.',

		popup_virtual_title: 'Konkurs wirtualny',
		popup_virtual_category_tasks: 'Zadania',
		popup_virtual_table_tr_task: 'Zadanie',
		popup_virtual_table_tr_actions: 'Czynności',
		popup_virtual_noVirtualTasks: 'Brak zadań! Dodaj je przez bazę zadań lub z archiwum.',
		popup_virtual_category_optionsOverride: 'Opcje konkursu',
		popup_virtual_blockOtherSubpages: 'Blokuj niepowiązane podstrony',
		popup_virtual_scoreBy: 'Wynik liczony wg',
		popup_virtual_scoreBy_best: 'najlepszy wynik',
		popup_virtual_scoreBy_last: 'ostatnie zgłoszenie',
		popup_virtual_running: 'Trwa konkurs',
		popup_virtual_running_left: 'Pozostały czas',
		popup_virtual_running_tasks: 'Zadania',
		popup_virtual_running_settings: 'Ustawienia',
		popup_virtual_running_stop: 'Zakończ konkurs',
		popup_virtual_running_stopped: 'Konkurs zatrzymany',
		popup_virtual_running_stopNotice: 'Zadania i ustawienia pozostaną zapisane',
		popup_virtual_started: 'Konkurs wystartował',
		popup_virtual_setTimeFirst: 'Najpierw ustaw czas konkursu',

		popup_options_language: 'Język:',
		popup_options_title: 'Opcje',
		popup_options_hideScores: 'Ukrywaj wyniki',
		popup_options_hideRulesTab: 'Ukrywaj zakładkę \'zasady\'',
		popup_options_hideInitReportBadges: 'Ukrywaj informację',
		popup_options_hideInitReportBadgesInfo: 'o wstępnym sprawozdaniu z testowania ostatniego zgłoszenia w konkursie',
		popup_options_inlineProblemStatements: 'Treści w tekście',
		popup_options_statementsOnSamePageOption: 'Treści na tej samej stronie',
		popup_options_c_func: 'Poprawki i funkcje:',
		popup_options_c_meta: 'Meta-options i dane rozszerzenia:',
		popup_options_export: 'Export',
		popup_options_import: 'Import',
		popup_options_removeAllData: 'Usuń wszystkie dane',

		popup_data_confirm_import_replace: 'Import nadpisze obecne dane. Kontynuować?',
		popup_data_confirm_delete_all: 'Usunąć wszystkie dane rozszerzenia?',
		popup_data_import_success: 'Zaimportowano dane.',
		popup_data_import_invalid: 'Nie udało się zaimportować danych. Sprawdź plik JSON.',
		popup_data_delete_success: 'Wszystkie dane zostały usunięte.',
		popup_common_confirm: 'Potwierdź',
		popup_common_cancel: 'Anuluj',
		popup_data_import_pick_file: 'Wybierz plik JSON do importu.',

		popup_todo_title: 'Do zrobienia',
		popup_todo_empty: 'Brak zadań na liście.',
		popup_todo_col_task: 'Zadanie',
		popup_todo_col_actions: 'Akcje',

		menu_addToTODO: 'Dodaj do listy \'Do zrobienia\'',
		menu_removeFromTODO: 'Usuń z listy \'Do zrobienia\'',
		menu_addToVirtual: 'Dodaj do konkursu wirtualnego',
		menu_removeFromVirtual: 'Usuń z konkursu wirtualnego',
		menu_revealScore: 'Ujawnij wynik',
		menu_viewNote: 'Zobacz notatkę',

		menu_added: 'Dodano!',
		menu_removed: 'Usunięto!',

		pageBlockedMessage1: 'Hej! Piszesz konkurs wirtualny a to jest niezwiązana podstrona.',
		pageBlockedMessage2: 'Wybierz jedno z zadań z panelu po lewej lub wcześnie zakończ konkurs w panelu rozszerzenia.'
	},
	en: {
		popup_home_virtual: 'Virtual contest',
		popup_home_todo: 'To-do tasks',
		popup_home_options: 'Options',
		popup_home_refreshPls: 'Saved, please refresh the page to apply changes',

		popup_home_szkopulStatusUpFor: 'Szkopul has been up for',
		popup_home_szkopulStatusRecordUptime: 'Record uptime is',
		popup_home_szkopulStatusMore: 'from czywyjebalohomika.xyz, @lcd.101',

		popup_home_hideScores: 'Hide scores',
		dashboard_stats_lastMonth: 'solved in the last month',
		dashboard_stats_today: 'solved today',
		dashboard_stats_total: 'solved total',
		dashboard_stats_chars: 'chars submitted',
		dashboard_stats_bestDay: 'best day',
		dashboard_randomTask: 'Random task',
		dashboard_randomTaskTODO: 'Random task from TODO',
		dashboard_seeStats: 'See stats',
		dashboard_noRandomTask: 'No tasks available for random pick.',

		popup_virtual_title: 'Virtual contest',
		popup_virtual_category_tasks: 'Tasks',
		popup_virtual_table_tr_task: 'Task',
		popup_virtual_table_tr_actions: 'Actions',
		popup_virtual_noVirtualTasks: 'No tasks! Add them through the task database or from the archive.',
		popup_virtual_category_optionsOverride: 'Contest options',
		popup_virtual_blockOtherSubpages: 'Block unrelated subpages',
		popup_virtual_scoreBy: 'Score by',
		popup_virtual_scoreBy_best: 'best score',
		popup_virtual_scoreBy_last: 'last submission',
		popup_virtual_running: 'Contest running',
		popup_virtual_running_left: 'Time left',
		popup_virtual_running_tasks: 'Tasks',
		popup_virtual_running_settings: 'Settings',
		popup_virtual_running_stop: 'Stop contest',
		popup_virtual_running_stopped: 'Contest stopped',
		popup_virtual_running_stopNotice: 'Task or settings won\'t be discarded',
		popup_virtual_started: 'Virtual contest started',
		popup_virtual_setTimeFirst: 'Set contest time first',

		popup_options_language: 'Language:',
		popup_options_title: 'Options',
		popup_options_hideScores: 'Hide scores',
		popup_options_hideRulesTab: 'Hide \'rules\' tab',
		popup_options_hideInitReportBadges: 'Hide the badge',
		popup_options_hideInitReportBadgesInfo: 'displaying the last submission\'s initial testing report in contests',
		popup_options_inlineProblemStatements: 'Inline problem statements',
		popup_options_statementsOnSamePageOption: 'Statements on the same page',
		popup_options_c_func: 'Fixes and features:',
		popup_options_c_meta: 'Meta-settings and extension data:',
		popup_options_export: 'Export',
		popup_options_import: 'Import',
		popup_options_removeAllData: 'Delete all data',

		popup_data_confirm_import_replace: 'Import will overwrite current data. Continue?',
		popup_data_confirm_delete_all: 'Delete all extension data?',
		popup_data_import_success: 'Data imported successfully.',
		popup_data_import_invalid: 'Failed to import data. Please check the JSON file.',
		popup_data_delete_success: 'All data has been deleted.',
		popup_common_confirm: 'Confirm',
		popup_common_cancel: 'Cancel',
		popup_data_import_pick_file: 'Choose a JSON file to import.',

		popup_todo_title: 'To-do',
		popup_todo_empty: 'No tasks in the list.',
		popup_todo_col_task: 'Task',
		popup_todo_col_actions: 'Actions',

		menu_addToTODO: 'Add to to-do',
		menu_removeFromTODO: 'Remove from to-do',
		menu_addToVirtual: 'Add to virtual contest',
		menu_removeFromVirtual: 'Remove from virtual contest',
		menu_revealScore: 'Reveal score',
		menu_viewNote: 'View note',

		menu_added: 'Added!',
		menu_removed: 'Removed!',

		pageBlockedMessage1: 'Hey! You\'re writing a virtual contest and this is an unrelated subpage.',
		pageBlockedMessage2: 'Please select one of the tasks from the panel on the left or finish the contest early in the extension panel.'
	}
};