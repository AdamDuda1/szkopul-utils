import {setLang, t, type lang} from "../globals.js";
import { getTODO, removeTODOItem, reorderTODO, type TodoItem } from "../todo.js";

import browser from "webextension-polyfill";
import { getVirtualTasks, removeVirtualTask } from '../virtual';

export async function initLang() {
	const result = await browser.storage.local.get("lang");
	const storedLang: lang = result.lang === "en" ? "en" : "pl";
	setLang(storedLang);
}

export async function init() {
	await initVirtual();

	// loadData();
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

function optionsListeners() {
	document.getElementById('hideScoresOption')?.addEventListener('change', (event) => {
		browser.storage.local.set({ hideScores: (event.target as HTMLInputElement).checked });
		loadData();
	});

	document.getElementById('hideScoresQuickOption')?.addEventListener('change', (event) => {
		browser.storage.local.set({ hideScores: (event.target as HTMLInputElement).checked });
		loadData();
		document.getElementById('refresh-pls-home')!.style.display = 'flex';
	});

	document.getElementById('lang')!.addEventListener('change', () => {
		browser.storage.local.set({ lang: (document.getElementById('lang') as HTMLSelectElement).value }).then(() => {
			// backHome();
			// document.getElementById('refresh-pls-home')!.style.display = 'flex';
			location.reload();
		});
	});

	document.getElementById('btn-exportData')?.addEventListener('click', () => {
		void exportStorage();
	});

	document.getElementById('btn-importData')?.addEventListener('click', () => {
		const input = document.getElementById('input-importDataFile') as HTMLInputElement | null;
		if (!input) return;
		showPopupNotice(t('popup_data_import_pick_file'));
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
	});

	document.getElementById('input-importDataFile')?.addEventListener('change', (event) => {
		void importStorage(event);
	});

	document.getElementById('btn-deleteAllData')?.addEventListener('click', () => {
		void deleteAllData();
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
				<td><a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHTML(title)}</a></td>
				<td style="display: flex; border-top: 0 !important; border-bottom: 1px solid rgb(222, 226, 230);">
					<button type="button" class="btn btn-danger btn-xs" data-todo-remove="${encodeURIComponent(item.id)}">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3"
							 viewBox="0 0 16 16" style="position: relative; top: -2px;">
							<path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
						</svg>
					</button>
					<div style="display: flex; flex-direction: column; position: relative; top: -3px; left: 10px;">
						<button type="button" class="btn btn-default btn-xs" data-todo-move="up" 
							style="height: 16px; padding: 0;" data-todo-id="${encodeURIComponent(item.id)}" title="Move up">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
								<path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
							</svg>
						</button>
						<button type="button" class="btn btn-default btn-xs" data-todo-move="down"
							style="height: 16px; padding: 0;" data-todo-id="${encodeURIComponent(item.id)}" title="Move down">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
								<path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
							</svg>
						</button>
					</div>
				</td>
			</tr>
		`;
	}).join('');

	container.innerHTML = `
		<table class="table table-striped table-condensed" style="font-size: 12px; margin-top: 6px; margin-bottom: 0; width: 100%;">
			<thead>
				<tr>
					<th>${t('popup_todo_col_task')}</th>
					<th>${t('popup_todo_col_actions')}</th>
				</tr>
			</thead>
			<tbody>${rows}</tbody>
		</table>
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

	const button = target.closest('[data-todo-remove]') as HTMLElement | null;
	if (!button) return;

	const encodedId = button.getAttribute('data-todo-remove');
	if (!encodedId) return;

	await removeTODOItem(decodeURIComponent(encodedId));
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
				<a href="https://szkopul.edu.pl/problemset/problem/${task.id}/site/?key=statement">${task.name}</a>
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

async function importStorage(event: Event) {
	const input = event.target as HTMLInputElement;
	if (!input.files?.length) return;

	if (!await askPopupConfirm(t('popup_data_confirm_import_replace'))) {
		input.value = "";
		return;
	}

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
	if (!await askPopupConfirm(t('popup_data_confirm_delete_all'))) return;

	await browser.storage.local.clear();
	showPopupNotice(t('popup_data_delete_success'));
	loadData();
}

function showPopupNotice(message: string) {
	const notice = document.getElementById('popup-data-notice');
	if (!notice) return;
	notice.textContent = message;
	notice.style.display = 'block';
	setTimeout(() => {
		notice.style.display = 'none';
	}, 2500);
} // TODO CHANGE

function askPopupConfirm(message: string): Promise<boolean> {
	const box = document.getElementById('popup-confirm');
	const msg = document.getElementById('popup-confirm-message');
	const cancelBtn = document.getElementById('popup-confirm-cancel');
	const acceptBtn = document.getElementById('popup-confirm-accept');

	if (!box || !msg || !cancelBtn || !acceptBtn) return Promise.resolve(false);

	msg.textContent = message;
	box.style.display = 'block';

	return new Promise((resolve) => {
		const cleanup = () => {
			box.style.display = 'none';
			cancelBtn.removeEventListener('click', onCancel);
			acceptBtn.removeEventListener('click', onAccept);
		};
		const onCancel = () => {
			cleanup();
			resolve(false);
		};
		const onAccept = () => {
			cleanup();
			resolve(true);
		};

		cancelBtn.addEventListener('click', onCancel);
		acceptBtn.addEventListener('click', onAccept);
	});
} // TODO CHANGE