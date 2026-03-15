import browser from "webextension-polyfill";
const browserFunctions = true; // Set this to false and comment out the import above to test UI locally

setTimeout(() => {
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
		if (result.lang === "en") {

		} else {

		}
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
}


console.log('init?');
