import browser from 'webextension-polyfill';

export type TodoItem = {
	pos: number;
	name: string;
	id: string;
};

function phraseTODO(raw: unknown): TodoItem[] {
	if (!Array.isArray(raw)) return [];

	const mapped = raw
		.map((item, index): TodoItem | null => {
			if (typeof item === 'string') {
				return {pos: index + 1, name: '', id: item};
			}

			if (item && typeof item === 'object') {
				const candidate = item as Partial<TodoItem>;
				if (typeof candidate.id === 'string') {
					return {
						pos: typeof candidate.pos === 'number' ? candidate.pos : index + 1,
						name: typeof candidate.name === 'string' ? candidate.name : '',
						id: candidate.id
					};
				}
			}

			return null;
		})
		.filter((item): item is TodoItem => item !== null);

	const seenIds = new Set<string>();
	const unique: TodoItem[] = [];

	for (const item of mapped) {
		if (seenIds.has(item.id)) continue;
		seenIds.add(item.id);
		unique.push({...item, pos: unique.length + 1});
	}

	return unique;
}

async function waitForTODO(): Promise<TodoItem[]> {
	const result = await browser.storage.local.get('TODO');
	return phraseTODO(result['TODO']);
}

async function updateTODO(mutator: (todo: TodoItem[]) => TodoItem[]): Promise<TodoItem[]> {
	const latest = await waitForTODO();
	const next = mutator(latest).map((item, index) => ({...item, pos: index + 1}));
	await browser.storage.local.set({TODO: next});
	sessionStorage.setItem('todo', JSON.stringify(next));
	return next;
}

export function getTODO() { // TODO unused?
	return waitForTODO().then((todo) => {
		sessionStorage.setItem('todo', JSON.stringify(todo));
		return todo;
	});
}

export async function getRandomTODOItem(): Promise<TodoItem | null> {
	const todo = await waitForTODO();
	if (todo.length === 0) return null;

	const index = Math.floor(Math.random() * todo.length);
	return todo[index] ?? null;
}

export function removeTODOItem(id: string) {
	return updateTODO((todo) => todo.filter((item) => item.id !== id));
}

export function reorderTODO(orderIds: string[]) {
	return updateTODO((todo) => {
		const uniqueOrder = [ ...new Set(orderIds) ];
		const byId = new Map(todo.map((item) => [ item.id, item ]));
		const ordered: TodoItem[] = [];

		for (const id of uniqueOrder) {
			const item = byId.get(id);
			if (!item) continue;
			ordered.push(item);
			byId.delete(id);
		}

		ordered.push(...byId.values());
		return ordered;
	});
}

export async function addToTODOAction(id: string, name: string, _btn?: HTMLElement | null) {
	const normalizedId = id.trim();
	if (!normalizedId) return;

	const normalizedName = name.trim();

	try {
		await updateTODO((todo) => {
			if (todo.some((item) => item.id === normalizedId)) {
				return todo.filter((item) => item.id !== normalizedId);
			}

			return [ ...todo, {pos: todo.length + 1, name: normalizedName, id: normalizedId} ];
		});
	} catch (error) {
		console.error('TODO save failed', error);
	}
}