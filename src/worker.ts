import { fixContactButton, addUtilsFeedbackButton, makeEnterSearchThings, appendHomePageStats } from './misc-fixes';
import browser from "webextension-polyfill";
import { initNotes } from './notes';
import { appendProblemSetMenu, appendVirtualContestPanel } from './ui-elements';
import {hidePageContents, hideScores} from './ui-hiders';
import { addToTODOAction } from './todo';
import { setLang } from './globals';
import { getVirtualOptions, getVirtualTasks, saveVirtualOptions } from './virtual';

const manifestVersion = browser.runtime.getManifest().version;
console.log(`Thank you for using Szkopuł Utils (v${manifestVersion}), Dzięki! :)`);

const onStart = () => {
	void fixContactButton();
	void applyVirtualContestPageOptions();
};

async function applyVirtualContestPageOptions() {
	const options = await getVirtualOptions();
	if (!options.isRunning) return;

	const isExpired = options.startTime <= 0 || options.duration <= 0 || options.startTime + options.duration <= Date.now();
	if (isExpired) {
		await saveVirtualOptions({ ...options, isRunning: false });
		return;
	}

	if (options.scoreBy === 'last') {
		const lastScoreText = document.querySelector('#submission-status-table tbody tr:first-child td:last-child')?.textContent?.trim();
		if (lastScoreText) {
			document.querySelectorAll<HTMLElement>('[id*="score"]').forEach((el) => {
				el.textContent = lastScoreText;
			});
		}
	}

	if (options.hideScores) hideScores();

	if (options.blockOtherSubpages) {
		const path = window.location.pathname;
		const match = path.match(/^\/problemset\/problem\/([^/]+)\/site\//);
		const currentTaskId = match?.[1];
		const virtualTasks = await getVirtualTasks();
		const isVirtualTaskPage = !!currentTaskId && virtualTasks.some((task) => task.id === currentTaskId);

		if (!isVirtualTaskPage) hidePageContents();
	}
}

const init = () => {
	void addUtilsFeedbackButton();
	void appendProblemSetMenu(addToTODOAction);
	void appendVirtualContestPanel();
	void makeEnterSearchThings();
	void appendHomePageStats();
	void initNotes();
};

browser.storage.local.get("hideScores").then((result) => { if (result.hideScores === true) hideScores(); });

browser.storage.local.get("lang").then((result) => {
	if (result.lang === "en") setLang("en");
	else {
		setLang("pl");
		browser.storage.local.set({ lang: "pl" });
	}
	onStart();
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();

export async function storageLogTODO() {
	const result = await browser.storage.local.get("TODO");
	const arr = Array.isArray(result.TODO) ? result.TODO : [];
	console.log(arr);
}
