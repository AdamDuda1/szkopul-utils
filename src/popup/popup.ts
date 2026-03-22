import {setLang, t, type lang} from "../globals.js";
import { getTODO, removeTODOItem, reorderTODO, type TodoItem } from "../todo.js";

import browser from "webextension-polyfill";
import { getVirtualOptions, getVirtualTasks, removeVirtualTask, saveVirtualOptions } from '../virtual';
import { getOptions, optionsTemplate, programmingLanguage, saveOptions } from '../options';


let optionsObject: optionsTemplate;

export async function init() {
	optionsObject = await getOptions();
	setLang(optionsObject.lang);
}

export async function afterRender() {
	void loadOptions();
	void syncSzkopulStatus();
	initTODOView();
	await initVirtual();
}

function loadOptions() {
	// OPTIONS => FIXES AND FEATURES
	{
		(document.getElementById('hideScoresOption') as HTMLInputElement).checked = optionsObject.hideScores;
		(document.getElementById('hideScoresOption') as HTMLInputElement).addEventListener('change', () => {
			optionsObject!.hideScores = (document.getElementById('hideScoresOption') as HTMLInputElement).checked as boolean;
			saveOptions(optionsObject!).then(() => document.getElementById('refresh-pls-options')!.style.display = 'flex');
		});

		(document.getElementById('hideRulesTabOption') as HTMLInputElement).checked = optionsObject.hideRulesTab;
		(document.getElementById('hideRulesTabOption') as HTMLInputElement).addEventListener('change', () => {
			optionsObject!.hideRulesTab = (document.getElementById('hideRulesTabOption') as HTMLInputElement).checked as boolean;
			saveOptions(optionsObject!).then(() => document.getElementById('refresh-pls-options')!.style.display = 'flex');
		});

		(document.getElementById('preferredLang') as HTMLSelectElement).value = optionsObject.preferredLanguage;
		(document.getElementById('preferredLang') as HTMLSelectElement).addEventListener('change', () => {
			optionsObject!.preferredLanguage = (document.getElementById('preferredLang') as HTMLSelectElement).value as programmingLanguage;
			saveOptions(optionsObject!).then(() => document.getElementById('refresh-pls-options')!.style.display = 'flex');
		});

		// TODO here autmatically submit

		(document.getElementById('inlineProblemStatementsOption') as HTMLInputElement).checked = optionsObject.inlineProblemStatements;
		(document.getElementById('inlineProblemStatementsOption') as HTMLInputElement).addEventListener('change', () => {
			optionsObject!.inlineProblemStatements = (document.getElementById('inlineProblemStatementsOption') as HTMLInputElement).checked as boolean;
			saveOptions(optionsObject!).then(() => document.getElementById('refresh-pls-options')!.style.display = 'flex');
		});

		(document.getElementById('statementsOnSamePageOption') as HTMLInputElement).checked = optionsObject.statementsOnSamePage;
		(document.getElementById('statementsOnSamePageOption') as HTMLInputElement).addEventListener('change', () => {
			optionsObject!.statementsOnSamePage = (document.getElementById('statementsOnSamePageOption') as HTMLInputElement).checked as boolean;
			saveOptions(optionsObject!).then(() => document.getElementById('refresh-pls-options')!.style.display = 'flex');
		});

	}

	// OPTIONS => META-SETTINGS AND DATA
	{
		(document.getElementById('lang') as HTMLSelectElement).value = optionsObject!.lang;
		document.getElementById('lang')!.addEventListener('change', () => {
			optionsObject!.lang = (document.getElementById('lang') as HTMLSelectElement).value as lang;
			saveOptions(optionsObject!).then(() => window.location.reload());
		});

		document.getElementById('btn-importData')?.addEventListener('click', () => {
			const input = document.getElementById('input-importDataFile') as HTMLInputElement | null;
			if (!input) return;
			void showDataActionConfirmation(t('popup_data_confirm_import_replace'), () => {
				openImportFilePicker(input);
			});
		});

		document.getElementById('btn-exportData')?.addEventListener('click', () => {
			exportStorage();
		});

		document.getElementById('input-importDataFile')?.addEventListener('change', (event) => importStorage(event));
		document.getElementById('btn-deleteAllData')?.addEventListener('click', () => deleteAllData());
	}
}

function loadData() {
	browser.storage.local.get("hideScores").then((result) => {
		const hideScores = result.hideScores === true;
		let checkbox = document.getElementById('hideScoresOption') as HTMLInputElement | null;
		if (checkbox) checkbox.checked = hideScores;
		checkbox = document.getElementById('hideScoresQuickOption') as HTMLInputElement | null;
		if (checkbox) checkbox.checked = hideScores;
	});


	browser.storage.local.get("lang").then((result) => {
		const storedLang: lang = result.lang === "en" ? "en" : "pl";
		setLang(storedLang);
		(document.getElementById('lang') as HTMLSelectElement).value = storedLang;
	});
}


function itemUrl(id: string) {
	return `https://szkopul.edu.pl/problemset/problem/${encodeURIComponent(id)}/site/`;
}

function renderTODOEmpty() {
	const container = document.getElementById('todo-table');
	if (!container) return;
	container.innerHTML = `<div style="opacity: .8; font-size: 12px; margin-top: 6px;">${t('popup_todo_empty')}</div>`;
}

async function renderTODOTable() {
	const container = document.getElementById('todo-table');
	if (!container) return;

	const todo = await getTODO();
	if (todo.length === 0) {
		renderTODOEmpty();
		return;
	}

	const rows = todo.map((item: TodoItem) => {
		const title = item.name || item.id;
		const url = itemUrl(item.id);
		return `
			<tr data-todo-id="${encodeURIComponent(item.id)}">
				<td style="padding: 8px;">
					<a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHTML(title)}</a>
				</td>
				<td class="text-center" style="padding: 8px;">
					<div class="todo-actions-cell">
						<button type="button" class="btn btn-outline-success btn-xs" data-todo-complete="${encodeURIComponent(item.id)}" title="Done">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
								<path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/>
							</svg>
						</button>
						<div class="todo-move-buttons">
							<button type="button" class="btn btn-outline-secondary btn-xs" data-todo-move="up" data-todo-id="${encodeURIComponent(item.id)}" title="Move up" style="border: 0;">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
									<path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
								</svg>
							</button>
							<button type="button" class="btn btn-outline-secondary btn-xs" data-todo-move="down" data-todo-id="${encodeURIComponent(item.id)}" title="Move down" style="border: 0;">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
									<path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
								</svg>
							</button>
						</div>
					</div>
				</td>
			</tr>
		`;
	}).join('');

	container.innerHTML = `
		<div class="table-responsive-md" style="background: #181a1b; color: #d1cdc7; margin-top: 6px;">
			<table class="table button-flat" style="font-size: 12px; margin-bottom: 0; width: 100%;">
				<thead>
				<tr style="border-bottom: 2px solid #383d3f;">
					<th class="col-md-auto">${t('popup_todo_col_task')}</th>
					<th class="col-sm-4">${t('popup_todo_col_actions')}</th>
				</tr>
				</thead>
				<tbody>${rows}</tbody>
			</table>
		</div>
	`;
}

async function onTodoTableClick(event: Event) {
	const target = event.target as HTMLElement;

	const moveButton = target.closest('[data-todo-move]') as HTMLElement | null;
	if (moveButton) {
		const direction = moveButton.getAttribute('data-todo-move');
		const encodedId = moveButton.getAttribute('data-todo-id');
		if (!direction || !encodedId) return;

		const rows = Array.from(document.querySelectorAll('#todo-table tr[data-todo-id]'));
		const ids = rows
			.map((row) => row.getAttribute('data-todo-id'))
			.filter((id): id is string => Boolean(id));

		const from = ids.indexOf(encodedId);
		const to = direction === 'up' ? from - 1 : from + 1;
		if (from < 0 || to < 0 || to >= ids.length) return;

		const [current] = ids.splice(from, 1);
		ids.splice(to, 0, current);

		await reorderTODO(ids.map((id) => decodeURIComponent(id)));
		void renderTODOTable();
		return;
	}

	const button = target.closest('[data-todo-complete]') as HTMLElement | null;
	if (!button) return;

	const encodedId = button.getAttribute('data-todo-complete');
	if (!encodedId) return;

	await removeTODOItem(decodeURIComponent(encodedId));
	void renderTODOTable();
}

let todoViewInitialized = false;

function initTODOView() {
	if (todoViewInitialized) return;

	const table = document.getElementById('todo-table');
	if (table) {
		table.addEventListener('click', (event) => {
			void onTodoTableClick(event);
		});
	}

	document.getElementById('btn-showTODO')?.addEventListener('click', () => {
		void renderTODOTable();
	});

	todoViewInitialized = true;
	void renderTODOTable();
}

function escapeHTML(text: string) {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	};

	return text.replace(/[&<>"']/g, (char) => map[char]);
}

let runningViewIntervalId = 0;

function formatRemaining(ms: number) {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

type SzkopulStatusResponse = {
	isUp: boolean;
	lastCrashTime: string;
	lastRecoveryTime: string;
	downtimeCount: number;
};

let szkopulStatusIntervalId = 0;

function formatStatusDuration(ms: number) {
	const totalMinutes = Math.max(0, Math.floor(ms / 60000));
	const days = Math.floor(totalMinutes / (24 * 60));
	const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
	const minutes = totalMinutes % 60;

	if (days > 0) return `${days}d ${hours}h ${minutes}m`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

function setSzkopulStatusState(state: 'online' | 'offline' | 'unknown') {
	const dot = document.getElementById('szkopulStatusDot');
	const stateEl = document.getElementById('szkopulStatusState');
	if (!dot || !stateEl) return;

	if (state === 'online') {
		dot.style.background = '#1fb86a';
		stateEl.textContent = 'ONLINE';
		return;
	}

	if (state === 'offline') {
		dot.style.background = '#dc3545';
		stateEl.textContent = 'OFFLINE';
		return;
	}

	dot.style.background = '#f0ad4e';
	stateEl.textContent = 'UNKNOWN';
}

function stopSzkopulStatusTicker() {
	if (!szkopulStatusIntervalId) return;
	window.clearInterval(szkopulStatusIntervalId);
	szkopulStatusIntervalId = 0;
}

function startSzkopulStatusTicker(fromMs: number, isUp: boolean) {
	const upForEl = document.getElementById('szkopulStatusUpFor');
	if (!upForEl) return;

	const update = () => {
		const duration = Date.now() - fromMs;
		upForEl.textContent = `${formatStatusDuration(duration)}${isUp ? '' : ' (down)'}`;
	};

	update();
	stopSzkopulStatusTicker();
	szkopulStatusIntervalId = window.setInterval(update, 30_000);
}

async function syncSzkopulStatus() {
	const upForEl = document.getElementById('szkopulStatusUpFor');
	const metaEl = document.getElementById('szkopulStatusRecordUptime');
	if (!upForEl || !metaEl) return;

	const setUnavailable = () => {
		stopSzkopulStatusTicker();
		setSzkopulStatusState('unknown');
		upForEl.textContent = '--';
		metaEl.textContent = 'API unavailable';
	};

	setSzkopulStatusState('unknown');
	upForEl.textContent = '...';
	metaEl.textContent = 'Loading...';

	try {
		const response = await fetch('https://czywyjebalohomika.xyz/api/status', { cache: 'no-store' });
		if (!response.ok) {
			setUnavailable();
			return;
		}

		const data = await response.json() as SzkopulStatusResponse;
		if (
			typeof data.isUp !== 'boolean'
			|| typeof data.lastCrashTime !== 'string'
			|| typeof data.lastRecoveryTime !== 'string'
			|| typeof data.downtimeCount !== 'number'
		) {
			setUnavailable();
			return;
		}

		const fromTime = Date.parse(data.isUp ? data.lastRecoveryTime : data.lastCrashTime);
		if (!Number.isFinite(fromTime)) {
			setUnavailable();
			return;
		}

		setSzkopulStatusState(data.isUp ? 'online' : 'offline');
		metaEl.textContent = `${Math.max(0, data.downtimeCount)} crash${data.downtimeCount === 1 ? '' : 'es'}`;
		startSzkopulStatusTicker(fromTime, data.isUp);
	} catch {
		setUnavailable();
	}
}

async function syncVirtualRunningPage() {
	const options = await getVirtualOptions();
	const now = Date.now();
	const endsAt = options.startTime + options.duration;
	const isRunning = options.isRunning && options.startTime > 0 && options.duration > 0 && endsAt > now;

	const runningBtn = document.getElementById('btn-showVirtualRunning');
	if (runningBtn) runningBtn.style.display = isRunning ? 'flex' : 'none';

	const homePage = document.getElementById('home');
	const todoPage = document.getElementById('todo');
	const optionsPage = document.getElementById('options');
	const virtualPage = document.getElementById('virtual');
	const runningPage = document.getElementById('virtual-running');

	const remainingEl = document.getElementById('virtual-running-remaining');
	const tasksEl = document.getElementById('virtual-running-tasks');

	if (!isRunning) {
		if (runningViewIntervalId) {
			window.clearInterval(runningViewIntervalId);
			runningViewIntervalId = 0;
		}
		if (options.isRunning && endsAt <= now) {
			await saveVirtualOptions({ ...options, isRunning: false });
		}
		if (remainingEl) remainingEl.textContent = '00:00:00';
		if (tasksEl) tasksEl.innerHTML = '';
		if (runningPage?.style.display === 'flex') {
			if (homePage) homePage.style.display = 'flex';
			runningPage.style.display = 'none';
		}
		return;
	}

	if (runningPage && runningPage.style.display !== 'flex') {
		if (homePage) homePage.style.display = 'none';
		if (todoPage) todoPage.style.display = 'none';
		if (optionsPage) optionsPage.style.display = 'none';
		if (virtualPage) virtualPage.style.display = 'none';
		runningPage.style.display = 'flex';
	}

	const tasks = await getVirtualTasks();
	if (tasksEl) {
		tasksEl.innerHTML = tasks.length === 0
			? `<div style="opacity: .8;">${t('popup_virtual_noVirtualTasks')}</div>`
			: tasks.map((task) => `
				<div style="margin-bottom: 5px;">
					<a href="https://szkopul.edu.pl/problemset/problem/${encodeURIComponent(task.id)}/site/?key=statement" target="_blank" rel="noopener noreferrer">${escapeHTML(task.name)}</a>
				</div>
			`).join('');
	}

	const updateRemaining = () => {
		const left = Math.max(0, endsAt - Date.now());
		if (remainingEl) remainingEl.textContent = formatRemaining(left);
	};

	updateRemaining();
	if (runningViewIntervalId) window.clearInterval(runningViewIntervalId);
	runningViewIntervalId = window.setInterval(() => {
		updateRemaining();
		if (Date.now() >= endsAt) {
			window.clearInterval(runningViewIntervalId);
			runningViewIntervalId = 0;
			void saveVirtualOptions({ ...options, isRunning: false }).then(syncVirtualRunningPage);
		}
	}, 1000);
}




async function initVirtual() {
	let tasks = await getVirtualTasks();

	if (tasks.length > 0) document.getElementById('noVirtualTasks')!.style.display = 'none';

	for (const task of tasks) {
		let randomShit = Math.floor(Math.random() * 1000000);
		let id = 't' + task.id + randomShit;

		let _tr = document.createElement("tr");
		_tr.id = id;
		_tr.innerHTML = `
			<td style="padding: 8px;">
				<a href="https://szkopul.edu.pl/problemset/problem/${task.id}/site/?key=statement" target="_blank">
					${task.name}
				</a>
			</td>

			<td class="text-center" style="padding: 8px;">
				<button type="button" class="btn btn-outline-danger btn-xs" id="${'remove' + id}">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3"
						 viewBox="0 0 16 16" style="position: relative; top: -2px;">
						<path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
					</svg>
				</button>
			</td>
		`;
		document.getElementById('virtualTasksTable')!.append(_tr);

		document.getElementById('remove' + id)!.addEventListener('click', async () => {
			await removeVirtualTask(task.id);
			_tr.remove();
			if (document.getElementById('virtualTasksTable')!.children.length === 0) document.getElementById('noVirtualTasks')!.style.display = 'flex';
		});
	}

	let options = await getVirtualOptions();
	(document.getElementById('virtualSetupHours') as HTMLInputElement).value = options.durationInputHours.toString();
	(document.getElementById('virtualSetupMinutes') as HTMLInputElement).value = options.durationInputMinutes.toString();
	(document.getElementById('virtualHideScoresOption') as HTMLInputElement).checked = Boolean(options.hideScores);
	(document.getElementById('virtualBlockOtherSubpagesOption') as HTMLInputElement).checked = Boolean(options.blockOtherSubpages);
	(document.getElementById('virtualScoreByOption') as HTMLSelectElement).value = options.scoreBy;

	document.getElementById('virtualSetupHours')!.addEventListener('input', e => {
		getVirtualOptions().then(options => {
			options.durationInputHours = Number((e.target as HTMLInputElement).value);
			saveVirtualOptions(options);
		});
	});

	document.getElementById('virtualSetupMinutes')!.addEventListener('input', e => {
		getVirtualOptions().then(options => {
			options.durationInputMinutes = Number((e.target as HTMLInputElement).value);
			saveVirtualOptions(options);
		});
	});

	document.getElementById('virtualHideScoresOption')!.addEventListener('input', e => {
		getVirtualOptions().then(options => {
			options.hideScores = Boolean((e.target as HTMLInputElement).checked);
			saveVirtualOptions(options);
		});
	});

	document.getElementById('virtualBlockOtherSubpagesOption')!.addEventListener('input', e => {
		getVirtualOptions().then(options => {
			options.blockOtherSubpages = Boolean((e.target as HTMLInputElement).checked);
			saveVirtualOptions(options);
		});
	});

	document.getElementById('virtualScoreByOption')!.addEventListener('change', e => {
		getVirtualOptions().then(options => {
			const value = (e.target as HTMLSelectElement).value;
			options.scoreBy = value === 'last' ? 'last' : 'best';
			saveVirtualOptions(options);
		});
	});

	document.getElementById('btn-startVirtual')?.addEventListener('click', async () => {
		const hours = Number((document.getElementById('virtualSetupHours') as HTMLInputElement | null)?.value ?? 0);
		const minutes = Number((document.getElementById('virtualSetupMinutes') as HTMLInputElement | null)?.value ?? 0);
		const durationMs = Math.max(0, (hours * 60 + minutes) * 60 * 1000);

		if (durationMs <= 0) {
			showPopupNotice(t('popup_virtual_setTimeFirst'));
			return;
		}

		const currentOptions = await getVirtualOptions();
		await saveVirtualOptions({
			...currentOptions,
			durationInputHours: hours,
			durationInputMinutes: minutes,
			duration: durationMs,
			startTime: Date.now(),
			isRunning: true,
		});

		showPopupNotice(t('popup_virtual_started'));
		void syncVirtualRunningPage();
	});

	document.getElementById('btn-stopVirtual')?.addEventListener('click', async () => {
		const currentOptions = await getVirtualOptions();
		await saveVirtualOptions({ ...currentOptions, isRunning: false });
		showPopupNotice(t('popup_virtual_running_stopped'));
		document.getElementById('virtual-running')!.style.display = 'none';
		document.getElementById('home')!.style.display = 'flex';
		void syncVirtualRunningPage();
	});

	void syncVirtualRunningPage();
}






async function exportStorage() {
	const data = await browser.storage.local.get(null);
	const json = JSON.stringify(data, null, 2);

	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = "szkopul-utils-data.json";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	URL.revokeObjectURL(url);
}

function showPopupNotice(message: string) {
	const notice = document.getElementById('popup-data-notice');
	if (!notice) return;

	notice.textContent = message;
	notice.style.display = 'block';
	window.setTimeout(() => {
		notice.style.display = 'none';
	}, 2200);
}

function openImportFilePicker(input: HTMLInputElement) {
	if (typeof input.showPicker === 'function') {
		try {
			input.showPicker();
			return;
		} catch {
			input.click();
			return;
		}
	}
	input.click();
}

async function showDataActionConfirmation(question: string, onConfirm: () => void | Promise<void>) {
	const optionsPage = document.getElementById('options');
	const confirmation = document.getElementById('confirmation');
	const questionEl = document.getElementById('confirmationQuestion');
	const cancelBtn = document.getElementById('confirmationOK') as HTMLButtonElement | null;
	const confirmBtn = document.getElementById('confirmationBAD') as HTMLButtonElement | null;

	if (!optionsPage || !confirmation || !questionEl || !cancelBtn || !confirmBtn) {
		await onConfirm();
		return;
	}

	const close = () => {
		optionsPage.style.display = 'flex';
		confirmation.style.display = 'none';
		cancelBtn.onclick = null;
		confirmBtn.onclick = null;
	};

	optionsPage.style.display = 'none';
	confirmation.style.display = 'flex';
	questionEl.innerText = question;
	cancelBtn.innerText = t('popup_common_cancel');
	confirmBtn.innerText = t('popup_common_confirm');

	cancelBtn.onclick = () => {
		close();
	};

	confirmBtn.onclick = () => {
		void Promise.resolve(onConfirm()).finally(close);
	};
}

async function importStorage(event: Event) {
	const input = event.target as HTMLInputElement;
	if (!input.files?.length) return;

	const file = input.files[0];
	const text = await file.text();

	try {
		const data = JSON.parse(text);
		if (typeof data !== "object" || data === null || Array.isArray(data)) throw new Error("Invalid JSON");

		await browser.storage.local.clear();
		await browser.storage.local.set(data as Record<string, unknown>);
		showPopupNotice(t('popup_data_import_success'));
		loadData();
	} catch {
		showPopupNotice(t('popup_data_import_invalid'));
	}

	input.value = "";
}

async function deleteAllData() {
	await showDataActionConfirmation(t("popup_data_confirm_delete_all"), async () => {
		await browser.storage.local.clear();
		window.location.reload();
	});
}