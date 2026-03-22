import {
	fixContactButton, addUtilsFeedbackButton, makeEnterSearchThings, languageSelectorFix,
	inlineStatements, statementsOnSamePage
} from './misc-fixes';
import browser from "webextension-polyfill";
import { initNotes } from './notes';
import { appendHomeDashboardSummary, appendProblemSetMenu, appendVirtualContestPanel } from './ui-elements';
import {hidePageContents, hideRulesTab, hideScores} from './ui-hiders';
import { addToTODOAction } from './todo';
import { setLang } from './globals';
import { getVirtualOptions, getVirtualTasks, saveVirtualOptions } from './virtual';
import {getOptions, optionsTemplate} from "./options";

const manifestVersion = browser.runtime.getManifest().version;
console.log(`Thank you for using Szkopuł Utils (v${manifestVersion}), Dzięki! :)`);

let optionsObject: optionsTemplate;

const onStart = () => {
	setLang(optionsObject.lang);
	void fixContactButton();
	void applyVirtualContestPageOptions();
	if (optionsObject.hideScores) void hideScores();
	if (optionsObject.hideRulesTab) void hideRulesTab();
};

const onLoad = () => {
	void addUtilsFeedbackButton();
	void languageSelectorFix(optionsObject.preferredLanguage);

	void appendProblemSetMenu(addToTODOAction);
	void appendVirtualContestPanel();
	void makeEnterSearchThings();
	void appendHomeDashboardSummary();
	void initNotes();

	if (optionsObject.statementsOnSamePage) void statementsOnSamePage();
	if (optionsObject.inlineProblemStatements) void inlineStatements();

	// void addTaskSolvedEventTriggers();
};

getOptions().then((ans) => { optionsObject = ans; onStart(); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onLoad, { once: true });
else onLoad();


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


export async function storageLogTODO() {
	const result = await browser.storage.local.get("TODO");
	const arr = Array.isArray(result.TODO) ? result.TODO : [];
	console.log(arr);
}
