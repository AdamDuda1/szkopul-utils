import browser from "webextension-polyfill";

export type task = { id: string; name: string };
const KEY = "virtualTasks";

export async function getVirtualTasks(): Promise<task[]> {
	const { [KEY]: tasks = [] } = await browser.storage.local.get(KEY);
	return tasks as task[];
}

export async function addVirtualTask(id: string, name: string): Promise<void> {
	const tasks = await getVirtualTasks();

	tasks.push({ id, name });
	await browser.storage.local.set({ [KEY]: tasks });
}

export async function removeVirtualTask(id: string): Promise<void> {
	const tasks = await getVirtualTasks();
	await browser.storage.local.set({ [KEY]: tasks.filter((t) => t.id !== id) });
}