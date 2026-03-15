import { fixContactButton, addUtilsFeedbackButton, makeEnterSearchThings, appendHomePageStats } from './misc-fixes';
import browser from "webextension-polyfill";
import { initNotes } from './notes';
import { appendProblemSetMenu } from './ui-elements';
import { hideScores } from './ui-hiders';
import { addToTODOAction } from './todo';

const manifestVersion = chrome.runtime.getManifest().version;
console.log(`Thank you for using Szkopuł Utils (v${manifestVersion}), Dzięki! :)`);

fixContactButton();

browser.storage.local.get("hideScores").then((result) => { if (result.hideScores === true) hideScores(); });

const init = () => {
	addUtilsFeedbackButton();
	appendProblemSetMenu(addToTODOAction);
	makeEnterSearchThings();
	appendHomePageStats();
	initNotes();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();

export async function storageLogTODO() {
	const result = await browser.storage.local.get("TODO");
	const arr = Array.isArray(result.TODO) ? result.TODO : [];
	console.log(arr);
}
