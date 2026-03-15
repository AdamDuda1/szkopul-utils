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

function renderNotes(host: HTMLDivElement, id: string, name: string, displayName: boolean = false) {
	const header = displayName ? html`<h2>Notatki do \'${name}\'</h2>` : '';
	render(
		html`
            ${header}
			<textarea class="form-control" rows="3" id="notes-area" placeholder="Twoje notatki do tego zadania..."></textarea>
            <div style="width: 100%; display: flex; justify-content: space-between;">
                <span style="font-size: 11px; margin-left: 5px; color: gray;">ctrl+z działa!</span>
                <button type="button" class="btn btn-success" style="margin-top: 7px;" id="notes-save">Zapisz</button>
            </div>
		`, host
	);

	const area = host.querySelector<HTMLTextAreaElement>('#notes-area');
	const saveButton = host.querySelector<HTMLButtonElement>('#notes-save');
	if (!area || !saveButton) return;

	getNotes(id).then(notes => {
		if (notes != undefined)	{
			area.value = notes.toString();
			area.rows = Math.min(Math.max(area.value.split(/\r\n|\r|\n/).length, 3), 25);
		}
	});

	saveButton.addEventListener('click', () => {
		const btn = saveButton;

		saveNotes(area.value, id).then((r) => {
			if (r) btn.innerHTML = 'Zapisano!';
			else btn.innerHTML = 'Wyczyszczono!';
			setTimeout(() => btn.innerHTML = 'Zapisz', 1000);
		});
	});

	area.addEventListener('keydown', (event) => {
		if (event.key.toLowerCase() === 's' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			const btn = saveButton;

			saveNotes(area.value, id).then((r) => {
				if (r) btn.innerHTML = 'Zapisano!';
				else btn.innerHTML = 'Wyczyszczono!';
				setTimeout(() => btn.innerHTML = 'Zapisz', 1000);
			});
		}
	});

	// document.getElementById('notes-area')?.addEventListener('input', (event) => { TODO auto-expand while typing
	// 	const area = event.target as HTMLTextAreaElement;
	// 	if ()
	// });
}

export function initNotes() {
	if (!window.location.href.includes('/problem/')) return;

	const target = document.querySelector('.nav-content .text-center.bottom-text');
	if (!target) return;

	const host = document.createElement('div');
	host.style.marginTop = '12px';
	target.insertAdjacentElement('afterend', host);

	const url = window.location.href;
	const match = url.match(/\/problemset\/problem\/([^/]+)\/site\//);
	const id = match?.[1];

	renderNotes(host, id!, '');
}

export function problemSetMenuSeeNote(id: string, name: string) {
	if (!id) return;

	document.getElementById('szkopul-utils-note')?.remove();

	const host = document.createElement('div');
	host.id = 'szkopul-utils-note';
	document.body.appendChild(host);

	const closeOverlay = () => host.remove();

	render(html`
        <div style="position: fixed; top: 0; left: 0; z-index: 1999; width: 100%; height: 100%;
	        	display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.14);"
             id="szkopul-utils-notes-overlay" @click=${closeOverlay}>
	        <div id="szkopul-utils-note-content" @click=${(event: Event) => event.stopPropagation()}
	        style="background: ${(localStorage.getItem("dark-mode") === "enabled" ? '#181a1b' : 'white')} !important; padding: 15px; border-radius: 14px;
	        box-shadow: 0 0 18px 3px ${(localStorage.getItem("dark-mode") === "enabled" ? '#181a1b' : 'white')}; width: 70%; min-height 300px"></div>
        </div>
		  `, host);

	const noteHost = host.querySelector('#szkopul-utils-note-content') as HTMLDivElement | null;
	if (!noteHost) {
		host.remove();
		return;
	}

	renderNotes(noteHost, id, name, true);

	document.getElementById('notes-area')?.focus();

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') _closeOverlay();
	};

	const _closeOverlay = () => {
		document.removeEventListener('keydown', onKeyDown);
		host.remove();
	};

	document.addEventListener('keydown', onKeyDown);
}