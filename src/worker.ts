import { fixContactButton } from './misc-fixes';
const manifestVersion = chrome.runtime.getManifest().version;
console.log(`Thank you for using Szkopuł Utils (v${manifestVersion}), Dzięki! :)`);


fixContactButton();


const init = () => {
	problemSetAddMenu();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();


function problemSetAddMenu() {
	if (!window.location.href.includes('/problemset')) return;
	let firstRow = true;
	document.querySelectorAll('tr').forEach((tr: HTMLTableRowElement) => {
		if (firstRow) {
			const cell = document.createElement('td');
			cell.innerHTML = '<b>Utils</b>';
			tr.appendChild(cell);
			tr.style.borderBottom = '2px solid #dee2e6';
			firstRow = false;
			return;
		}

		const secondTd = tr.querySelectorAll('td')[1];
		const url = secondTd?.querySelector('a')?.href ?? '';

		const match = url.match(/\/problemset\/problem\/([^/]+)\/site\//);
		const result = match?.[1];

		const cell = document.createElement('td');
		cell.innerHTML = `
            <div class="btn-group">
                <button class="btn btn-outline-secondary dropdown-toggle add-to-contest-button pl-1 pr-2" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="caret add-contest-caret"></span>
                    <span class="d-none loading-spinner job-active"><i class="fa-solid fa-rotate-right spinner"></i></span>
                </button>
                <div class="dropdown-menu dropdown-menu-right">
                    <h5 class="dropdown-header">Szkopuł Utils</h5>
                    <a class="dropdown-item" href="https://google.com/${result}">Oznacz jako Do Zrobienia</a>
                </div>
            </div>
        `;
		tr.appendChild(cell);
	});

	const contactContainer = document.getElementById('szkopul-contact-form-open-div');
	if (contactContainer) {
		const btn = document.createElement('button');
		btn.className = 'btn btn-info';
		btn.id = 'szkopul-contact-form-open';
		(btn as HTMLButtonElement).type = 'button';
		btn.setAttribute('data-toggle', 'modal');
		btn.setAttribute('data-target', '#szkopul-contact-form');
		btn.textContent = 'Kontakt';
		contactContainer.appendChild(btn);
	}
}

