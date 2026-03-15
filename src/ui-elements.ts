import { storageLogTODO } from './worker';
import { html, render, mathml } from 'lit';
import { problemSetMenuSeeNote } from './notes';
import { t } from './globals';
// TODO TRY matml!! ^

function menuHTML() {
	return `
		<div class="btn-group">
            <button class="btn btn-outline-secondary dropdown-toggle add-to-contest-button pl-1 pr-2" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="caret add-contest-caret"></span>
                <span class="d-none loading-spinner job-active"><i class="fa-solid fa-rotate-right spinner"></i></span>
            </button>
            <div class="dropdown-menu dropdown-menu-right" style="min-width: 300px;">
                <h5 class="dropdown-header">Szkopuł Utils</h5>
				
				<a class="dropdown-item action-todo" href="#">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-card-checklist" viewBox="0 0 16 16">
					  <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z"/>
					  <path d="M7 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0M7 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0"/>
					</svg>
					<span>${t('menu_markAsTODO')}</span>
				</a>
				
				<a class="dropdown-item action-virtual" href="#">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock" viewBox="0 0 16 16">
						<path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
						<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
					</svg>
					<span>${t('menu_addToVirtual')}</span>
				</a>
				
				<a class="dropdown-item action-notes" href="#">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
						<path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
					</svg>
					<span>${t('menu_viewNote')}</span>
				</a>
            </div>
        </div>
	`
}

export function appendProblemSetMenu(addToTODOAction: (id: string, name: string, btn: HTMLAnchorElement) => void) {
	// render(menuHTML(), ( as HTMLDivElement)!);
	document.querySelector('.problem-title.text-center.content-row > h1')?.insertAdjacentHTML('afterend', menuHTML());


	if (!window.location.href.includes('/problemset')) return;
	let validRows = false;

	const rows = document.querySelectorAll('tr');

	for (let i = rows.length - 1; i >= 0; i--) {
		const tr = rows[i];

		if (i == 0 && validRows) {
			const cell = document.createElement('td');
			cell.innerHTML = '<b>Utils</b>';
			tr.appendChild(cell);
			tr.style.borderBottom = '2px solid #dee2e6';
			return;
		}

		const secondTd = tr.querySelectorAll('td')[1];
		const url = secondTd?.querySelector('a')?.href ?? '';

		const match = url.match(/\/problemset\/problem\/([^/]+)\/site\//);
		const id = match?.[1];
		const name = secondTd?.querySelector('a')?.innerText.toString();

		if (id != undefined) {
			const cell = document.createElement('td');
			cell.innerHTML = menuHTML();

			cell.querySelector<HTMLAnchorElement>('.action-virtual')?.addEventListener('click', (event) => {
				event.preventDefault();
				event.stopPropagation();
				console.log('VIRTUAL', id, name);
			});

			cell.querySelector<HTMLAnchorElement>('.action-todo')?.addEventListener('click', (event) => {
				event.preventDefault();
				event.stopPropagation();
				addToTODOAction(id, name!, event.currentTarget as HTMLAnchorElement);
			});

			cell.querySelector<HTMLAnchorElement>('.action-notes')?.addEventListener('click', (event) => {
				event.preventDefault();
				// event.stopPropagation();
				problemSetMenuSeeNote(id, name!);
			});

			tr.appendChild(cell);
			validRows = true;
		}
	}
}

