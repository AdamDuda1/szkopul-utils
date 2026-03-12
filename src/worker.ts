import { html, render } from 'lit';

const manifestVersion = chrome.runtime.getManifest().version;
console.log(`Thank you for using Szkopuł Utils (v${manifestVersion}), Dzięki! :)`);


fixContactButton();


const init = () => {
	problemSetAddMenu();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();


function problemSetAddMenu() {
	let firstRow = true;
	document.querySelectorAll('tr').forEach((tr: HTMLTableRowElement) => {
		if (firstRow) {
			const cell = document.createElement('td');
			render(html`
				<b>Utils</b>
			`, cell);
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
		render(html`
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
		`, cell);
		tr.appendChild(cell);
	});
}

function fixContactButton() {
	const css: string = `
        #szkopul-contact-form-open-div {
            position: absolute !important;
            left: 7px !important;
            bottom: 10px !important;
            width: auto !important;
        }
    `;

	const styleElement: HTMLStyleElement = document.createElement('style');
    styleElement.textContent = css;

    document.documentElement.appendChild(styleElement);
}