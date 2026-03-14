import { fixContactButton, addUtilsFeedbackButton, makeEnterSearchThings } from './misc-fixes';
import browser from "webextension-polyfill";

const manifestVersion = chrome.runtime.getManifest().version;
console.log(`Thank you for using Szkopuł Utils (v${manifestVersion}), Dzięki! :)`);

fixContactButton();

const init = () => {
	addUtilsFeedbackButton();
	problemSetAddMenu();
	makeEnterSearchThings();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();

export async function storageLogTODO() {
	const result = await browser.storage.local.get("TODO");
	const arr: string[] = Array.isArray(result.TODO) ? result.TODO : [];
	console.log(arr);
}

export function addToTODO(id: string) {
	storageAddTODO(id).then(() => {
		console.log(`Added ${id} to TODO list`);
	}).catch((error) => {
		console.error('Error adding to TODO list:', error);
	});
}

async function storageAddTODO(id: string) {
	const result = await browser.storage.local.get("TODO");
	const arr: string[] = Array.isArray(result.TODO) ? result.TODO : [];

	arr.push(id);

	await browser.storage.local.set({ TODO: arr });
}


function problemSetAddMenu() {
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
		const result = match?.[1];

		if (result != undefined) {
			const cell = document.createElement('td');
			cell.innerHTML = `
	            <div class="btn-group">
	                <button class="btn btn-outline-secondary dropdown-toggle add-to-contest-button pl-1 pr-2" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
	                    <span class="caret add-contest-caret"></span>
	                    <span class="d-none loading-spinner job-active"><i class="fa-solid fa-rotate-right spinner"></i></span>
	                </button>
	                <div class="dropdown-menu dropdown-menu-right">
	                    <h5 class="dropdown-header">Szkopuł Utils</h5>
	                    
	                    <a class="dropdown-item" href="#"
	                    onclick="event.preventDefault(); console.log('todo: ${result}'); addToTODO('todo: ${result}')">
		                    Oznacz jako Do Zrobienia
	                    </a>

	                    <a class="dropdown-item" href="#"
	                    onclick="event.preventDefault(); console.log('vietual: ${result}'); storageLogTODO();">
							Dodaj do wirtualki
						</a>
						
						<a class="dropdown-item js-todo" href="#">Oznacz jako Do Zrobienia</a>
						
						<a class="dropdown-item js-virtual" href="#">Dodaj do wirtualki</a>
	                </div>
	            </div>
        	`;

			cell.querySelector<HTMLAnchorElement>('.js-todo')?.addEventListener('click', (event) => {
				event.preventDefault();
				addToTODO(`todo: ${result}`);
			});

			cell.querySelector<HTMLAnchorElement>('.js-virtual')?.addEventListener('click', (event) => {
				event.preventDefault();
				storageLogTODO();
			});

			tr.appendChild(cell);
			validRows = true;
		}
	}
}

