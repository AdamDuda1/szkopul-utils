import { html, render } from 'lit';
import browser from "webextension-polyfill";

export async function saveNotes(notes: string, id: string) {
	const key = 'notes-' + id;

	if (notes.length > 0) {
		await browser.storage.local.set({ [key]: notes });
		return true;
	} else {
		await browser.storage.local.remove([key]);
		return false;
	}
}

export async function getNotes(id: string) {
	const key = 'notes-' + id;
	const result = await browser.storage.local.get(key);
	return result[key];
}

export function initNotes() {
	if (!window.location.href.includes('/problem/')) return;

	const target = document.querySelector('.nav-content .text-center.bottom-text');
	if (!target) return;

	const host = document.createElement('div');
	host.style.marginTop = '12px';
	target.insertAdjacentElement('afterend', host);

	render(
		html`
			<textarea class="form-control" rows="3" id="notes-area" placeholder="Twoje notatki do tego zadania..."></textarea>
            <div style="width: 100%; display: flex; justify-content: space-between;">
                <span style="font-size: 11px; margin-left: 5px; color: gray;">ctrl+z działa!</span>
                <button type="button" class="btn btn-success" style="margin-top: 7px;" id="notes-save">Zapisz</button>
            </div>
		`, host
	);

	let area: HTMLTextAreaElement = document.getElementById('notes-area') as HTMLTextAreaElement;

	const url = window.location.href;
	const match = url.match(/\/problemset\/problem\/([^/]+)\/site\//);
	const id = match?.[1];
	console.log('ID:' + id);

	getNotes(id!).then(notes => {
		area.value = notes!.toString() ?? '';
	});

	document.getElementById('notes-save')!.addEventListener('click', (event) => {
		const btn = event.target as HTMLButtonElement;

		saveNotes(area.value, id!).then((r) => {
			if (r) btn.innerHTML = 'Zapisano!';
			else btn.innerHTML = 'Wyczyszczono!';
			setTimeout(() => btn.innerHTML = 'Zapisz', 1000);
		});
	});
}