import {renderPopup} from "./popup-ui";
import {setLang, t, type lang} from "../globals.js";

import browser from "webextension-polyfill";
const browserFunctions = true; // Set this to false and comment out the import above to test UI locally

setTimeout(async () => {
	if (browserFunctions) {
		const result = await browser.storage.local.get("lang");
		const storedLang: lang = result.lang === "en" ? "en" : "pl";
		setLang(storedLang);
	}

	renderPopup();

	document.getElementById('btn-showTODO')?.addEventListener('click', showTODO);
	document.getElementById('btn-showOptions')?.addEventListener('click', showOptions);

	document.getElementById('btn-backHome-options')?.addEventListener('click', backHome);
	document.getElementById('btn-backHome-TODO')?.addEventListener('click', backHome);

	loadData();
	optionsListeners();
}, 50);

export function backHome() {
	document.getElementById('home')!.style.display = 'flex';
	document.getElementById('todo')!.style.display = 'none';
	document.getElementById('options')!.style.display = 'none';
}

export function showTODO() {
	document.getElementById('home')!.style.display = 'none';
	document.getElementById('todo')!.style.display = 'flex';
	document.getElementById('options')!.style.display = 'none';
}

export function showOptions() {
	document.getElementById('options')!.style.display = 'flex';
	document.getElementById('home')!.style.display = 'none';
	document.getElementById('todo')!.style.display = 'none';
}

function loadData() {
	if (!browserFunctions) return;
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
	if (!browserFunctions) return;
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
}

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
}


console.log('init?');
