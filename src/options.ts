import browser from 'webextension-polyfill';
import { contest } from './globals';

export type programmingLanguage = '' | 'C' | 'C++' | 'Pascal' | 'Python' | 'Rust';

const KEY_OPTIONS = 'options';
const KEY_PINNED_CONTESTS = 'pinnedContests';

export type optionsTemplate = {
	lang: 'pl' | 'en',
	hideScores: boolean,
	hideInitReportBadges: boolean,
	hideRulesTab: boolean,
	preferredLanguage: programmingLanguage,
	inlineProblemStatements: boolean,
	statementsOnSamePage: boolean,
	whatsOnHomeOption: 'qs' | 'status',
}

const DEFAULT_OPTIONS: optionsTemplate = {
	lang: 'pl',
	hideScores: false,
	hideInitReportBadges: false,
	hideRulesTab: false,
	preferredLanguage: '',
	inlineProblemStatements: false,
	statementsOnSamePage: false,
	whatsOnHomeOption: 'qs',
};

export async function getOptions(): Promise<optionsTemplate> {
	const data = await browser.storage.local.get(KEY_OPTIONS);
	const options = data[KEY_OPTIONS] as Partial<optionsTemplate> | undefined;
	if (!options || Array.isArray(options) || typeof options !== 'object') return {...DEFAULT_OPTIONS};
	return {...DEFAULT_OPTIONS, ...options} as optionsTemplate;
}

export async function saveOptions(newOptions: optionsTemplate): Promise<void> {
	await browser.storage.local.set({[KEY_OPTIONS]: newOptions});
}

export async function getPinnedContests(): Promise<contest[]> {
	const data = await browser.storage.local.get(KEY_PINNED_CONTESTS);
	const contests = data[KEY_PINNED_CONTESTS] as Partial<contest[]> | undefined;
	if (!contests || typeof contests !== 'object') return [];
	return contests as contest[];
}

export async function savePinnedContests(contests: contest[]): Promise<void> {
	await browser.storage.local.set({[KEY_PINNED_CONTESTS]: contests});
}