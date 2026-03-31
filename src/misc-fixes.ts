import { html, render } from 'lit';
import { programmingLanguage } from './options';
import { emitTaskSolved } from './ui-elements';
import browser from 'webextension-polyfill';

export function mandatoryFixesOnStart() {
	mandatoryCSSFixes();
	fixContactButton();
}

export function mandatoryFixesAfterDOMLoad() {
	addUtilsFeedbackButton();
	openLinksInNewTab();
	contestLinksOnHomePageLinkToProblems();
}

function attachCSS(css: string) {
	const styleElement: HTMLStyleElement = document.createElement('style');
	styleElement.textContent = css;	document.documentElement.appendChild(styleElement);
}

export function makeEnterSearchThings() {
	if (!(window.location.href.includes('/problemset') || window.location.href.includes('/contest'))) return;
	const input = document.querySelector<HTMLElement>('input[type=\'search\']');

	input?.addEventListener('keydown', function (e) {
		if ((e as KeyboardEvent).key === 'Enter') {
			e.preventDefault();
			(input?.parentElement?.parentElement! as HTMLFormElement).submit();
		}
	});
}

export function fixContactButton() {
	const css: string = `
        #szkopul-contact-form-open-div {
            position: absolute !important;
            left: 7px !important;
            bottom: 12px !important;
            width: auto !important;
		    height: 35px;
        }
        
        #szkopul-contact-form-open-div button {
            padding: 6px;
		    font-size: 12px;
		    display: flex;
		    align-items: center;
        }
    `;

	attachCSS(css);
}

export function mandatoryCSSFixes() {
	const css: string = `
		.szkopul-dashboard__container.body .dashboard-container {
			margin-left: 0; /* not the contact button but also a mandatory fix */
			margin-top: 20px !important;
		}
		
		.card-body.dashboard-card-body table.table.break-all-words tbody tr td:first-child { display: none; }
		.card-body.dashboard-card-body table.table.break-all-words tbody tr td:last-child { width: 100%; font-weight: bold; }
		.card-body.dashboard-card-body table.table.break-all-words { margin: 0; }
		
		.card-header.dashboard-panel-head { border-radius: 10px 10px 0 0; }
    `;

	attachCSS(css);

}

export function addUtilsFeedbackButton() {
	const contactContainer = document.getElementById('szkopul-contact-form-open-div');
	if (contactContainer) {
		// contactContainer.children[0].classList.add('btn-sm');
		const template = html`
            <button
                    class="btn btn-info"
                    id="szkopul-contact-form-open"
                    type="button"
                    style="margin-left: 7px"
                    data-toggle="modal"
                    data-target="#szkopul-contact-form"
                    onclick="event.stopPropagation(); window.open('https://github.com/AdamDuda1/szkopul-utils/issues/new', '_blank').focus();"
            >
                Utils Feedback
            </button>
		`;
		render(template, contactContainer);
	}
}

export function languageSelectorFix(preferredLanguage: programmingLanguage) {
	let selectElements = document.querySelectorAll('select');

	selectElements.forEach((element: HTMLSelectElement) => {
		setTimeout(() => {
			if (element.id.includes('prog_lang')) {
				element.disabled = false;
				element.value = preferredLanguage;
				console.log(preferredLanguage);
			}
		}, 200); // TODO fix: sometimes doesnt load yet!
	});
}

export function statementsOnSamePage() {
	const trs: HTMLTableRowElement[] = Array.from(document.querySelectorAll<HTMLTableRowElement>('.table.table-striped.table--narrow tbody tr'));

	let panel = document.getElementById('utils-inline-pdf-panel') as HTMLDivElement | null;
	if (!panel) {
		panel = document.createElement('div');
		panel.id = 'utils-inline-pdf-panel';
		panel.style.cssText = 'position:fixed;top:120px;right:-3px;border:1px solid white;z-index:2147483647;overflow:hidden;background:rgb(255,255,255);color:rgb(33,37,41);border-radius:8px 0 0 8px;padding:10px;box-shadow:0 0 400px 20px black !important;min-height:40vh;display:none';
		panel.innerHTML = `
			<div style="display:flex;gap:8px;justify-content:flex-end;margin-bottom:8px;">
				<button type="button" class="btn btn-primary" id="utils-inline-open-tab">Open in new tab</button>
				<button type="button" class="btn btn-success" id="utils-inline-submit">Submit</button>
				<button type="button" class="btn btn-secondary" id="utils-inline-close">Close</button>
			</div>
			<embed id="utils-inline-embed" src="" type="application/pdf" width="100%" height="500vh"/>
		`;
		document.body.appendChild(panel);
	}

	const embed = panel.querySelector<HTMLObjectElement>('#utils-inline-embed');
	const openInNewTabButton = panel.querySelector<HTMLButtonElement>('#utils-inline-open-tab');
	const submitButton = panel.querySelector<HTMLButtonElement>('#utils-inline-submit');
	const closeButton = panel.querySelector<HTMLButtonElement>('#utils-inline-close');

	let currentLink = '';
	let currentSubmitLink = '';

	const applyPanelWidth = () => {
		if (!panel) return;
		panel.style.width = window.innerWidth < 1300 ? '80vw' : '50vw';
	};

	applyPanelWidth();
	window.addEventListener('resize', applyPanelWidth);

	const closePanel = () => {
		if (!panel) return;
		panel.style.display = 'none';
	};

	closeButton?.addEventListener('click', closePanel);
	openInNewTabButton?.addEventListener('click', () => {
		if (currentLink) window.open(currentLink, '_blank');
	});
	submitButton?.addEventListener('click', () => {
		if (currentSubmitLink) window.location.href = currentSubmitLink;
	});

	document.addEventListener('click', (event) => {
		if (!panel || panel.style.display === 'none') return;
		if (!panel.contains(event.target as Node)) closePanel();
	});

	trs.forEach((element: HTMLTableRowElement) => {
		const link = element.querySelector<HTMLAnchorElement>('a');
		const href = link?.href;
		const rowLinks = Array.from(element.querySelectorAll<HTMLAnchorElement>('a'));
		const submitHref = rowLinks[rowLinks.length - 1]?.href || href;
		if (!link || !href || link.dataset.utilsInlineBound === '1') return;

		link.dataset.utilsInlineBound = '1';
		link.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			currentLink = href;
			currentSubmitLink = submitHref || '';
			if (embed) embed.setAttribute('src', href);
			if (panel) panel.style.display = 'block';
			applyPanelWidth();
		});
	});
}

export function inlineStatements() {
	const table = document.querySelector<HTMLTableElement>('.table.table-striped.table--narrow');
	if (!table) return;

	table.style.width = '100%';
	table.style.maxWidth = '100%';
	const wrapper = table.closest<HTMLElement>('.table-responsive');
	if (wrapper) {
		wrapper.style.width = '100%';
		wrapper.style.maxWidth = '100%';
	}

	const trs: HTMLTableRowElement[] = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'));

	trs.forEach((row: HTMLTableRowElement) => {
		if (row.dataset.utilsSamePageBound === '1') return;

		const links = Array.from(row.querySelectorAll<HTMLAnchorElement>('a'));
		const statementHref = links[0]?.href;
		if (!statementHref) return;

		row.dataset.utilsSamePageBound = '1';

		const detailsRow = document.createElement('tr');
		detailsRow.className = 'utils-inline-statement-row';

		const detailsCell = document.createElement('td');
		detailsCell.colSpan = Math.max(1, row.children.length);
		detailsCell.style.padding = '0 8px 6px 8px';
		detailsCell.innerHTML = `
			<details>
				<summary style="cursor:pointer;color:#4a6fa5;font-size:13px;padding:4px 0;user-select:none;">Show statement</summary>
				<div style="margin-top:6px;height:46vh;min-height:260px;max-height:80vh;border:1px solid #e9ecef;border-radius:6px;background:#fafbfc;overflow:auto;resize:vertical;">
					<embed type="application/pdf" width="100%" height="100%" />
				</div>
			</details>
		`;

		detailsRow.appendChild(detailsCell);
		row.parentElement?.insertBefore(detailsRow, row.nextSibling);

		const details = detailsCell.querySelector<HTMLDetailsElement>('details');
		const embed = detailsCell.querySelector<HTMLEmbedElement>('embed');
		details?.addEventListener('toggle', () => {
			if (!details.open) return;

			if (!embed) return;

			if (embed && !embed.getAttribute('src')) embed.setAttribute('src', statementHref);

			// fetch(statementHref)
			// 	.then(res => res.text())
			// 	.then(html => {
			// 		const parser = new DOMParser();
			// 		const doc = parser.parseFromString(html, 'text/html');
			// 		const el = doc.querySelector('.content');
			// 		console.log(doc);
			// 		console.log(el);
			// 		if (el) {
			// 			embed.parentElement!.innerHTML = doc.querySelector('html')!.innerHTML;
			// 		} else if (embed && !embed.getAttribute('src')) embed.setAttribute('src', statementHref);
			// 	});
		});
	});
}

export function attachSubmitFormFixesAndListeners() {
	if (!window.location.href.includes('submit')) return;
	if ((window as unknown as { __szkopulSubmitTracked?: boolean }).__szkopulSubmitTracked) return;
	(window as unknown as { __szkopulSubmitTracked?: boolean }).__szkopulSubmitTracked = true;

	// const editorToggle = document.getElementById('id_toggle_editor') as HTMLInputElement;
	// if (editorToggle.checked) editorToggle.click();
	// editorToggle.parentElement!.style.display = 'none';

	const findCodeTextarea = () => document.querySelector<HTMLTextAreaElement>('#id_code, textarea[name="code"]/*, textarea.ace_text-input*/');
	const getCodeValue = () => {
		const codeTextarea = findCodeTextarea();
		const textareaValue = codeTextarea?.value ?? '';
		const aceRef = (window as unknown as { ace?: { edit: (id: string) => { getSession: () => { getValue: () => string; on: (eventName: string, cb: () => void) => void } } } }).ace;
		const editorEl = document.getElementById('editor');
		if (!aceRef || !editorEl || editorEl.style.display === 'none') return textareaValue;
		try {
			return aceRef.edit('editor').getSession().getValue() ?? textareaValue;
		} catch {
			return textareaValue;
		}
	};

	const codeTextarea = findCodeTextarea();
	if (codeTextarea && !document.getElementById('utils-code-counter')) {
		const counter = document.createElement('div');
		counter.id = 'utils-code-counter';
		counter.style.cssText = 'display:block;margin-top:6px;font-size:12px;color:#6c757d;';

		const updateCounter = () => {
			const value = getCodeValue();
			const lines = value.length === 0 ? 0 : value.split(/\r\n|\r|\n/).length;
			counter.textContent = `Chars: ${ value.length } | Lines: ${ lines }`;
		};

		(codeTextarea.closest('.form-group') ?? codeTextarea.parentElement)?.appendChild(counter);
		codeTextarea.addEventListener('input', updateCounter);
		codeTextarea.addEventListener('change', updateCounter);
		document.addEventListener('mousemove', updateCounter);

		let aceCounterBound = false;
		const bindAceCounter = () => {
			if (aceCounterBound) return true;
			const aceRef = (window as unknown as { ace?: { edit: (id: string) => { getSession: () => { on: (eventName: string, cb: () => void) => void } } } }).ace;
			if (!aceRef) return false;
			try {
				aceRef.edit('editor').getSession().on('change', updateCounter);
				aceCounterBound = true;
				return true;
			} catch {
				return false;
			}
		};

		for (const delay of [ 0, 250, 700, 1500, 2500 ]) {
			window.setTimeout(() => {
				if (bindAceCounter()) updateCounter();
			}, delay);
		}

		window.setTimeout(updateCounter, 0);
		window.setTimeout(updateCounter, 500);
	}

	let solvedEmitted = false;
	let statsPersisted = false;
	let submitIntent = false;
	const getCodeStats = () => {
		const code = getCodeValue();
		const chars = code.length;
		const lines = chars === 0 ? 0 : code.split(/\r\n|\r|\n/).length;
		return {chars, lines};
	};
	const persistSubmissionStatsOnce = () => {
		if (statsPersisted) return;
		statsPersisted = true;

		const {chars, lines} = getCodeStats();
		if (chars <= 0 && lines <= 0) return;

		void browser.storage.local.get([ 'submittedCharsTotal', 'submittedLinesTotal' ]).then((data) => {
			const currentChars = typeof data.submittedCharsTotal === 'number' && Number.isFinite(data.submittedCharsTotal) && data.submittedCharsTotal >= 0 ? data.submittedCharsTotal : 0;
			const currentLines = typeof data.submittedLinesTotal === 'number' && Number.isFinite(data.submittedLinesTotal) && data.submittedLinesTotal >= 0 ? data.submittedLinesTotal : 0;
			return browser.storage.local.set({
				submittedCharsTotal: currentChars + chars,
				submittedLinesTotal: currentLines + lines,
			});
		}).catch(() => {
			statsPersisted = false;
		});
	};

	const emitSolvedOnce = () => {
		if (solvedEmitted) return;
		solvedEmitted = true;
		persistSubmissionStatsOnce();
		emitTaskSolved(window.location.href, 0);
	};

	document.addEventListener('submit', (event) => {
		const form = event.target instanceof HTMLFormElement ? event.target : null;
		if (!form || (!form.action.includes('/submit') && !window.location.pathname.includes('/submit'))) return;
		submitIntent = true;
		emitSolvedOnce();
	}, true);

	document.addEventListener('click', (event) => {
		const target = event.target as Element | null;
		const submitControl = target?.closest('button[type="submit"], input[type="submit"]') as HTMLButtonElement | HTMLInputElement | null;
		if (!submitControl) return;
		const form = submitControl.form ?? submitControl.closest('form');
		if (!(form instanceof HTMLFormElement)) return;
		if (!form.action.includes('/submit') && !window.location.pathname.includes('/submit')) return;
		submitIntent = true;
		emitSolvedOnce();
	}, true);

	window.addEventListener('beforeunload', () => {
		if (submitIntent) emitSolvedOnce();
	}, {capture: true});
}

export function openLinksInNewTab() {
	if (document.location.href.endsWith('/p/')) return;
	const as = document.querySelectorAll<HTMLAnchorElement>('.table-responsive-md table td > a');
	as.forEach(a => {
		if (a.href.includes('/p/')) a.target = '_blank';
	})
}

export function contestLinksOnHomePageLinkToProblems() {
	if (document.location.href.endsWith('.pl/')) return;
	const as = document.querySelectorAll<HTMLAnchorElement>('.dashboard-panel.col-lg-4 td > a');
	as.forEach(a => {
		a.href = a.href + 'p/';
	})
}