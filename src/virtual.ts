import browser from "webextension-polyfill";

const KEY_VIRTUAL_TASKS = "virtualTasks";
const KEY_VIRTUAL_OPTIONS = "virtualOptions";
export type task = { id: string; name: string };
export type virtualOptionsTemplate = {
	hideScores: boolean,
	blockOtherSubpages: boolean,
	scoreBy: 'best' | 'last',
	duration: number,
	durationInputHours: number,
	durationInputMinutes: number,
	startTime: number,
	isRunning: boolean,
	showMenu: boolean,
}

const DEFAULT_VIRTUAL_OPTIONS: virtualOptionsTemplate = {
	hideScores: false,
	blockOtherSubpages: false,
	scoreBy: 'best',
	duration: 0,
	durationInputHours: 2,
	durationInputMinutes: 30,
	startTime: 0,
	isRunning: false,
	showMenu: true,
};

export async function getVirtualTasks(): Promise<task[]> {
	const { [KEY_VIRTUAL_TASKS]: tasks = [] } = await browser.storage.local.get(KEY_VIRTUAL_TASKS);
	return tasks as task[];
}

export async function addVirtualTask(id: string, name: string): Promise<void> {
	const tasks = await getVirtualTasks();

	tasks.push({ id, name });
	await browser.storage.local.set({ [KEY_VIRTUAL_TASKS]: tasks });
}

export async function removeVirtualTask(id: string): Promise<void> {
	const tasks = await getVirtualTasks();
	await browser.storage.local.set({ [KEY_VIRTUAL_TASKS]: tasks.filter((t) => t.id !== id) });
}

export async function getVirtualOptions(): Promise<virtualOptionsTemplate> {
	const { [KEY_VIRTUAL_OPTIONS]: options } = await browser.storage.local.get(KEY_VIRTUAL_OPTIONS);
	if (!options || Array.isArray(options) || typeof options !== "object") return { ...DEFAULT_VIRTUAL_OPTIONS };
	const merged = { ...DEFAULT_VIRTUAL_OPTIONS, ...(options as Partial<virtualOptionsTemplate>) };
	if (merged.scoreBy !== 'best' && merged.scoreBy !== 'last') merged.scoreBy = 'best';
	return merged;
}

export async function saveVirtualOptions(newOptions: virtualOptionsTemplate): Promise<void> {
	await browser.storage.local.set({ [KEY_VIRTUAL_OPTIONS]: newOptions });
}