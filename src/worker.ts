import { fixContactButton, addUtilsFeedbackButton, makeEnterSearchThings, appendHomePageStats } from './misc-fixes';
import browser from "webextension-polyfill";
import { initNotes } from './notes';
import { appendProblemSetMenu } from './ui-elements';
import { hideScores } from './ui-hiders';
import { addToTODOAction } from './todo';
import { setLang } from './globals';

const manifestVersion = browser.runtime.getManifest().version;
console.log(`Thank you for using Szkopuł Utils (v${manifestVersion}), Dzięki! :)`);

fixContactButton();

browser.storage.local.get("hideScores").then((result) => { if (result.hideScores === true) hideScores(); });

browser.storage.local.get("lang").then((result) => {
	if (result.lang === "en") setLang("en");
	else {
		setLang("pl");
		browser.storage.local.set({ lang: "pl" });
	}
});

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
