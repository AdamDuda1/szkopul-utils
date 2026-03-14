import browser from 'webextension-polyfill';

type TodoItem = {
	pos: number;
	name: string;
	id: string;
};

function phraseTODO(raw: unknown): TodoItem[] {
	if (!Array.isArray(raw)) return [];

	const mapped = raw
		.map((item, index): TodoItem | null => {
			if (typeof item === 'string') {
				return { pos: index + 1, name: '', id: item };
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

	return mapped.map((item, index) => ({ ...item, pos: index + 1 }));
}

async function waitForTODO(): Promise<TodoItem[]> {
	const result = await browser.storage.local.get("TODO");
	return phraseTODO(result["TODO"]);
}

export function getTODO() {
	return waitForTODO().then((todo) => {
		sessionStorage.setItem('todo', JSON.stringify(todo));
		return todo;
	});
}

export function addToTODOAction(id: string, name: string, btn: HTMLAnchorElement) {
	void (async () => {
		try {
			const todo = await waitForTODO();

			if (todo.some((item) => item.id === id)) {
				btn.textContent = 'Juz jest na liscie!';
				return;
			}

			const next = [...todo, { pos: todo.length + 1, name, id }];
			await browser.storage.local.set({ ["TODO"]: next });
			sessionStorage.setItem('todo', JSON.stringify(next));

			btn.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-card-checklist" viewBox="0 0 16 16">
					<path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z"/>
					<path d="M7 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0M7 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0"/>
				</svg>
				Dodano!
			`;
		} catch (error) {
			console.error('TODO save failed', error);
			btn.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-emoji-frown" viewBox="0 0 16 16">
					<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
					<path d="M4.285 12.433a.5.5 0 0 0 .683-.183A3.5 3.5 0 0 1 8 10.5c1.295 0 2.426.703 3.032 1.75a.5.5 0 0 0 .866-.5A4.5 4.5 0 0 0 8 9.5a4.5 4.5 0 0 0-3.898 2.25.5.5 0 0 0 .183.683M7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5m4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5"/>
				</svg>
				Błąd! Zobacz konsolę.
			`;
		}
	})();
}