import { problemSetMenuSeeNote } from './notes';
import { DEBUG, t, contest, task } from './globals';
import { getRandomTODOItem, getTODO } from './todo';
import { addVirtualTask, getVirtualOptions, getVirtualTasks, removeVirtualTask, saveVirtualOptions } from './virtual';
import {getOptions, getPinnedContests, optionsTemplate, savePinnedContests} from './options';

let optionsObject: optionsTemplate;
let pinnedContests: contest[];
let virtualTasks: task[] = [];
let todoTaskIds = new Set<string>();
const TASK_SOLVED_EVENT = 'szkopul-utils:taskSolved';

type TaskSolvedEventPayload = {
	problemId?: string;
	solvedAt?: string | number | Date;
};

export function emitTaskSolved(problemId = '', solvedAt = new Date()) {
	window.dispatchEvent(new CustomEvent(TASK_SOLVED_EVENT, {
		detail: { problemId, solvedAt: solvedAt.toISOString() }
	}));
}

function parseTaskSolvedDate(raw: TaskSolvedEventPayload['solvedAt']) {
	if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
	if (typeof raw === 'number') {
		const date = new Date(raw);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	if (typeof raw === 'string') return parseDate(raw);
	return null;
}

function onTaskSolved(handler: (problemId: string, date: Date) => void) {
	const listener = (event: Event) => {
		const payload = (event as CustomEvent<TaskSolvedEventPayload>)?.detail;
		const date = parseTaskSolvedDate(payload?.solvedAt);
		if (!date) return;
		date.setHours(0, 0, 0, 0);
		handler(payload?.problemId ?? '', date);
	};

	window.addEventListener(TASK_SOLVED_EVENT, listener);
	return () => window.removeEventListener(TASK_SOLVED_EVENT, listener);
}

function buildMenu(id: string, name: string, problemSet: boolean, revealScoreButton: boolean) {
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
					<span>${todoTaskIds.has(id) ? t('menu_removeFromTODO') : t('menu_addToTODO')}</span>
				</a>
				
				<a class="dropdown-item action-virtual" href="#">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock" viewBox="0 0 16 16">
						<path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
						<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
					</svg>
					<span>${virtualTasks.some((t) => t.id === id) ? t('menu_removeFromVirtual') : t('menu_addToVirtual')}</span>
				</a>
				
				${
				revealScoreButton ?
				`
					<a class = "dropdown-item action-score" href="#">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
							<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
							<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
						</svg>
						<span>${t("menu_revealScore")}</span>
					</a>
				` : ``
				}
				
				<a class="dropdown-item action-notes" href="#">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
						<path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
					</svg>
					<span>${t('menu_viewNote')}</span>
				</a>
            </div>
        </div>
	`;
}

export async function appendProblemSetMenu(addToTODOAction: (id: string, name: string, btn: HTMLAnchorElement) => void | Promise<void>) {
	optionsObject = await getOptions();
	virtualTasks = await getVirtualTasks();
	todoTaskIds = new Set((await getTODO()).map((item) => item.id));

	let scoresHidden = optionsObject.hideScores;

	// render(menuHTML(), ( as HTMLDivElement)!);
	// document.querySelector('.problem-title.text-center.content-row > h1')?.insertAdjacentHTML('afterend', menuHTML());

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

		const scoreTd = tr.querySelector('td.result__margin');

		let thisScore: string;
		if (scoresHidden && scoreTd != null) thisScore = (scoreTd as HTMLTableElement).innerText;

		if (id != undefined) {
			const cell = document.createElement('td');

			const renderCell = () => {
				cell.innerHTML = buildMenu(id, name!, true, scoresHidden && scoreTd != null);
				attachHandlers();
			};

			const attachHandlers = () => {
				let todoActionInProgress = false;
				let virtualActionInProgress = false;

				cell.querySelector<HTMLAnchorElement>('.action-todo')?.addEventListener('click', async (event) => {
					event.preventDefault();
					event.stopPropagation();
					if (todoActionInProgress) return;

					todoActionInProgress = true;

					try {
						await addToTODOAction(id, name!, event.currentTarget as HTMLAnchorElement);
						todoTaskIds = new Set((await getTODO()).map((item) => item.id));
						renderCell();
					} finally {
						todoActionInProgress = false;
					}
				});

				cell.querySelector<HTMLAnchorElement>('.action-virtual')?.addEventListener('click', async (event) => {
					event.preventDefault();
					event.stopPropagation();
					if (virtualActionInProgress) return;

					virtualActionInProgress = true;

					const anchorEl = event.currentTarget as HTMLElement | null;
					const setLabel = (text: string) => {
						try {
							const span = anchorEl?.querySelector('span');
							if (span) span.textContent = text;
							else if (anchorEl) anchorEl.textContent = text;
						} catch (e) {
							if (anchorEl) anchorEl.innerHTML = text;
						}
					};

					try {
						if (virtualTasks.some((t) => t.id === id)) {
							await removeVirtualTask(id);
							setLabel(t("menu_removed"));
						} else {
							await addVirtualTask(id, name!);
							setLabel(t("menu_added"));
						}
						virtualTasks = await getVirtualTasks();
						renderCell();
					} finally {
						virtualActionInProgress = false;
					}
				});

				if (scoresHidden && scoreTd != null)
				cell.querySelector<HTMLAnchorElement>('.action-score')?.addEventListener('click', (event) => {
					event.preventDefault();
					if (confirm('Are you sure?')) {
						alert(thisScore);
					}
				});

				cell.querySelector<HTMLAnchorElement>('.action-notes')?.addEventListener('click', (event) => {
					event.preventDefault();
					problemSetMenuSeeNote(id, name!);
				});
			};

			if (scoresHidden && scoreTd != null) (scoreTd as HTMLTableElement).innerText = '';

			renderCell();

			tr.appendChild(cell);
			validRows = true;
		}
	}
}

function formatRemaining(ms: number) {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

let virtualPanelIntervalId = 0;

function toDateKey(date: Date) {
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function parseDate(raw: string) {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const parsed = new Date(trimmed);
	if (!Number.isNaN(parsed.getTime())) return parsed;

	const monthDayMatch = trimmed.match(/^(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
	if (monthDayMatch) {
		let year = new Date().getFullYear();
		const [, mm, dd, hh, min, ss] = monthDayMatch;
		let monthDayParsed = new Date(year, Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
		if (monthDayParsed.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
			year -= 1;
			monthDayParsed = new Date(year, Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
		}
		if (!Number.isNaN(monthDayParsed.getTime())) return monthDayParsed;
	}

	const dotMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
	if (!dotMatch) return null;

	const [, dd, mm, yyyy] = dotMatch;
	const dotParsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
	return Number.isNaN(dotParsed.getTime()) ? null : dotParsed;
}

function parseSolvedEntryFromRow(row: HTMLTableRowElement) {
	const statusCell = row.querySelector<HTMLElement>('td[id*="-status"]');
	const statusClass = statusCell?.className.toLowerCase() ?? '';
	const text = row.textContent?.toLowerCase() ?? '';
	const solvedByClass = /submission--ok/.test(statusClass);
	const solvedByText = /(\b100\b|accepted|\bok\b|zaakcept|poprawne|\bac\b)/.test(text);
	if (!solvedByClass && !solvedByText) return null;

	const href = row.querySelector<HTMLAnchorElement>('a[href*="/problemset/problem/"]')?.href ?? '';
	const submissionProblem = row.querySelector<HTMLElement>('td[id*="-problem-instance"], td.col-lg-4')?.textContent?.trim() ?? '';
	const problemId = href.match(/\/problemset\/problem\/([^/]+)/)?.[1] ?? submissionProblem;

	const dateRaw = row.querySelector('time')?.getAttribute('datetime')
		?? row.querySelector('time')?.textContent
		?? row.querySelector<HTMLElement>('td[id*="-link"]')?.textContent
		?? Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim() ?? '').find((value) => /\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(value) || value.length > 4)
		?? '';

	const parsedDate = parseDate(dateRaw);
	if (!parsedDate) return null;

	parsedDate.setHours(0, 0, 0, 0);
	return { date: parsedDate, problemId };
}

function getSolvedDashboardEntries() {
	const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('table.submission tbody tr, .szkopul-dashboard__container tr'));
	const entries: { date: Date; problemId: string }[] = [];

	for (const row of rows) {
		const parsedEntry = parseSolvedEntryFromRow(row);
		if (parsedEntry) entries.push(parsedEntry);
	}

	return entries;
}

async function getSolvedEntriesFromSubmissionsPages(maxPages = 12) {
	const entries: { date: Date; problemId: string }[] = [];
	let nextUrl = `${window.location.origin}/submissions/`;

	for (let page = 0; page < maxPages && nextUrl; page++) {
		try {
			const response = await fetch(nextUrl, { credentials: 'include' });
			if (!response.ok) break;

			const html = await response.text();
			const doc = new DOMParser().parseFromString(html, 'text/html');
			const rows = Array.from(doc.querySelectorAll<HTMLTableRowElement>('table.submission tbody tr'));
			for (const row of rows) {
				const parsedEntry = parseSolvedEntryFromRow(row);
				if (parsedEntry) entries.push(parsedEntry);
			}

			const nextHref = doc.querySelector<HTMLAnchorElement>('a[rel="next"], .pagination a[aria-label*="Next"], .pagination a[aria-label*="Nast"]')?.getAttribute('href') ?? '';
			nextUrl = nextHref ? new URL(nextHref, window.location.origin).toString() : '';
		} catch (error) {
			console.warn('Failed to load submissions history page', nextUrl, error);
			break;
		}
	}

	return entries;
}

function getHeatColor(value: number) {
	if (value <= 0) return '#2d333b';
	if (value === 1) return '#0e4429';
	if (value <= 3) return '#006d32';
	if (value <= 6) return '#26a641';
	return '#39d353';
}

function getDashboardSubmissionDetailUrls() {
	const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('table.submission tbody tr a[href*="/s/"]'));
	const unique = new Set<string>();

	for (const link of links) {
		const url = link.getAttribute('href');
		if (!url || !/\/s\/\d+\//.test(url)) continue;
		unique.add(new URL(url, window.location.origin).toString());
	}

	return Array.from(unique);
}

function parseSubmittedCharsFromDetailsDoc(doc: Document) {
	const rows = Array.from(doc.querySelectorAll('tr'));
	for (const row of rows) {
		const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>('th, td'));
		for (let i = 0; i < cells.length - 1; i++) {
			const label = (cells[i].textContent ?? '').toLowerCase();
			if (!/(chars?|characters?|znak(?:i|ow|ów)?|length|dlugosc|d[łl]ugo[śs]c)/.test(label)) continue;

			const valueText = cells[i + 1].textContent ?? '';
			const numeric = valueText.replace(/\s+/g, '').match(/\d+/)?.[0];
			if (!numeric) continue;

			const parsed = Number.parseInt(numeric, 10);
			if (Number.isFinite(parsed) && parsed >= 0) return parsed;
		}
	}

	const bodyText = (doc.body?.textContent ?? '').replace(/\s+/g, ' ');
	const inlineMatches = [
		bodyText.match(/(?:chars?|characters?|znak(?:i|ow|ów)?|length|dlugosc|d[łl]ugo[śs]c)\s*[:\-]?\s*(\d[\d\s]*)/i),
		bodyText.match(/(\d[\d\s]*)\s*(?:chars?|characters?|znak(?:i|ow|ów)?)/i),
	];

	for (const match of inlineMatches) {
		const raw = match?.[1];
		if (!raw) continue;
		const parsed = Number.parseInt(raw.replace(/\s+/g, ''), 10);
		if (Number.isFinite(parsed) && parsed >= 0) return parsed;
	}

	return null;
}

async function getDashboardSubmittedCharsTotal() {
	const detailUrls = getDashboardSubmissionDetailUrls();
	if (detailUrls.length === 0) return 0;

	let total = 0;
	for (const detailUrl of detailUrls) {
		try {
			const response = await fetch(detailUrl, { credentials: 'include' });
			if (!response.ok) continue;

			const html = await response.text();
			const doc = new DOMParser().parseFromString(html, 'text/html');
			const chars = parseSubmittedCharsFromDetailsDoc(doc);
			if (chars != null) total += chars;
		} catch (error) {
			console.warn('Failed to parse submitted chars from details page', detailUrl, error);
		}
	}

	return total;
}

export async function pinContestButtons() {
	pinnedContests = await getPinnedContests();

	const tds = document.querySelectorAll<HTMLTableElement>(
		'.card-body.dashboard-card-body table.table.break-all-words tbody tr td:last-child,' +
		'article .table-responsive-md table.table tbody tr td:last-child'
	);

	tds.forEach((td: HTMLTableElement) => {
		if (DEBUG) td.style.background = 'red';

		if (td.children.length > 1) return;

		let thisContest: contest = {
			name: (td.children[0] as HTMLAnchorElement).innerText,
			href: (td.children[0] as HTMLAnchorElement).href,
			slug: (td.parentElement?.children[0] as HTMLElement).innerText
		};

		td.style.display = 'flex';

		let btnDiv = document.createElement('div');
		btnDiv.style = 'display: flex; position: relative; top: 1px; left: 5px; cursor: pointer; color: gray;';
		btnDiv.setAttribute('data-pin-button-href', thisContest.href);
		btnDiv.addEventListener('mouseenter', () => btnDiv.style.color = 'orange');
		btnDiv.addEventListener('mouseleave', () => btnDiv.style.color = 'gray');

		const button = (q: HTMLDivElement) => {
			if (!pinnedContests.some((c) => c.href === thisContest.href))
				q.innerHTML = `
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-angle" viewBox="0 0 16 16">
						<path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a6 6 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707s.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a6 6 0 0 1 1.013.16l3.134-3.133a3 3 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146m.122 2.112v-.002zm0-.002v.002a.5.5 0 0 1-.122.51L6.293 6.878a.5.5 0 0 1-.511.12H5.78l-.014-.004a5 5 0 0 0-.288-.076 5 5 0 0 0-.765-.116c-.422-.028-.836.008-1.175.15l5.51 5.509c.141-.34.177-.753.149-1.175a5 5 0 0 0-.192-1.054l-.004-.013v-.001a.5.5 0 0 1 .12-.512l3.536-3.535a.5.5 0 0 1 .532-.115l.096.022c.087.017.208.034.344.034q.172.002.343-.04L9.927 2.028q-.042.172-.04.343a1.8 1.8 0 0 0 .062.46z"/>
					</svg>
				`;
			else
				q.innerHTML = `
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-fill" viewBox="0 0 16 16">
						<path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354"/>
					</svg>
				`;
		};

		btnDiv.addEventListener('click', () => {
			const isPinned = pinnedContests.some((c) => c.href === thisContest.href);
			if (isPinned) pinnedContests = pinnedContests.filter((c) => c.href !== thisContest.href);
			else pinnedContests.push(thisContest);

			savePinnedContests(pinnedContests);
			button(btnDiv);
			const container = document.getElementById('szkopul-utils-pinned-contests') as HTMLDivElement;
			if (container) { renderPinnedContests(container); pinContestButtons(); }
			updateAllPinButtons();
		});

		button(btnDiv);

		td.append(btnDiv);
	});
}

async function renderPinnedContests(container: HTMLDivElement) {
	const fallbackPins = await getPinnedContests();

	const body = container.querySelector<HTMLTableElement>('.table.break-all-words');
	if (!body) return;

	if (fallbackPins.length === 0) {
		body.innerHTML = '<p class="pinned-empty">No pinned contests yet.</p>';
	} else {
		body.innerHTML = '';
		const list = document.createElement('tbody');
		for (const contest of fallbackPins) {
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td>${contest.slug}</td>
				<td><a href="${contest.href}">${contest.name}</a></td>
			`;
			list.appendChild(tr);
		}
		body.appendChild(list);
	}
}

function updateAllPinButtons() {
	document.querySelectorAll<HTMLDivElement>('[data-pin-button-href]').forEach(btn => {
		const href = btn.getAttribute('data-pin-button-href');
		const isPinned = pinnedContests.some((c) => c.href === href);
		btn.innerHTML = isPinned ? 
			'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-fill" viewBox="0 0 16 16"><path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354"/></svg>'
			: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-angle" viewBox="0 0 16 16"><path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a6 6 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707s.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a6 6 0 0 1 1.013.16l3.134-3.133a3 3 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146m.122 2.112v-.002zm0-.002v.002a.5.5 0 0 1-.122.51L6.293 6.878a.5.5 0 0 1-.511.12H5.78l-.014-.004a5 5 0 0 0-.288-.076 5 5 0 0 0-.765-.116c-.422-.028-.836.008-1.175.15l5.51 5.509c.141-.34.177-.753.149-1.175a5 5 0 0 0-.192-1.054l-.004-.013v-.001a.5.5 0 0 1 .12-.512l3.536-3.535a.5.5 0 0 1 .532-.115l.096.022c.087.017.208.034.344.034q.172.002.343-.04L9.927 2.028q-.042.172-.04.343a1.8 1.8 0 0 0 .062.46z"/></svg>';
	});
}

export function prependPinnedContestsDashboardCard() {
	if (document.getElementById('szkopul-utils-pinned-contests')) return;

	const dashboardPanels = Array.from(document.querySelectorAll<HTMLElement>('.dashboard-panel'));
	const rightPanel = dashboardPanels.find((panel) => panel.querySelector('a[href="/contest/"]'));
	if (!rightPanel) return;

	if (!document.getElementById('szkopul-utils-pinned-contests-style')) {
		const style = document.createElement('style');
		style.id = 'szkopul-utils-pinned-contests-style';
		style.classList.add('card-body', 'dashboard-card-body');
		style.textContent = `
			#szkopul-utils-pinned-contests { margin-bottom: 12px; padding-bottom: 8px; }
			#szkopul-utils-pinned-contests .dashboard-card-body { padding-top: 10px; }
			#szkopul-utils-pinned-contests ul { margin: 0; padding-left: 18px; }
			#szkopul-utils-pinned-contests li { margin-bottom: 4px; }
			#szkopul-utils-pinned-contests .pinned-empty { opacity: 0.75; margin: 0; }
		`;
		document.head.appendChild(style);
	}

	let header = document.createElement('div');
	header.classList.add('card-header', 'dashboard-panel-head');
	header.innerHTML = '<h4 class="mb-0">Pinned contests</h4>';

	const container = document.createElement('div');
	container.id = 'szkopul-utils-pinned-contests';
	container.classList.add('card-body', 'dashboard-card-body');
	container.innerHTML = '<table class="table break-all-words"></table>'

	renderPinnedContests(container);

	rightPanel.prepend(container);
	rightPanel.prepend(header);
}

export function appendHomeDashboardSummary() {
	if (document.getElementById('szkopul-utils-dashboard-summary')) return;

	const submissionsTable = document.querySelector<HTMLTableElement>('table.submission');
	const submissionsPanel = submissionsTable?.closest<HTMLElement>('.dashboard-panel');
	if (!submissionsPanel) return;

	const entries = getSolvedDashboardEntries();
	const solvedByDay = new Map<string, number>();
	const uniqueSolvedTasks = new Set<string>();

	for (const entry of entries) {
		const key = toDateKey(entry.date);
		solvedByDay.set(key, (solvedByDay.get(key) ?? 0) + 1);
		if (entry.problemId) uniqueSolvedTasks.add(entry.problemId);
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const monthAgo = new Date(today);
	monthAgo.setDate(monthAgo.getDate() - 29);

	let solvedLastMonth = 0;
	for (const entry of entries) {
		if (entry.date >= monthAgo) solvedLastMonth += 1;
	}

	let solvedToday = solvedByDay.get(toDateKey(today)) ?? 0;
	let bestDay = Math.max(0, ...Array.from(solvedByDay.values()));
	const emittedSolveKeys = new Set(entries
		.filter((entry) => !!entry.problemId)
		.map((entry) => `${entry.problemId}|${toDateKey(entry.date)}`));

	const openTask = (id: string) => {
		if (!id) return;
		window.location.href = `https://szkopul.edu.pl/problemset/problem/${encodeURIComponent(id)}/site/?key=statement`;
	};

	let submittedCharsTotal = 0;

	const container = document.createElement('div');
	container.id = 'szkopul-utils-dashboard-summary';
	container.className = 'szkopul-utils-dashboard-summary-card';

	if (!document.getElementById('szkopul-utils-dashboard-summary-style')) {
		const style = document.createElement('style');
		style.id = 'szkopul-utils-dashboard-summary-style';
		style.textContent = `
			#szkopul-utils-dashboard-summary { margin-top: 12px; border-top: 1px solid rgba(127, 127, 127, 0.35); }
			#szkopul-utils-dashboard-summary .dashboard-card-body { display: flex; flex-direction: column; gap: 12px; }
			#szkopul-utils-dashboard-summary .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; }
			#szkopul-utils-dashboard-summary .stats-grid-horizontal { display: grid; grid-template-columns: 1fr; gap: 8px 10px; }
			#szkopul-utils-dashboard-summary .stat-item { line-height: 1.2; }
			#szkopul-utils-dashboard-summary .stat-item b { display: block; font-size: 18px; }
			#szkopul-utils-dashboard-summary .stats-grid-primary .stat-item b { font-size: 20px; }
			#szkopul-utils-dashboard-summary .stats-grid-secondary .stat-item { opacity: 0.9; }
			#szkopul-utils-dashboard-summary .stat-extra { display: block; opacity: 0.75; font-size: 11px; }
			#szkopul-utils-dashboard-summary .summary-actions { margin-top: 2px; }
			#szkopul-utils-dashboard-summary #szkopul-utils-random-task-todo { width: 100%; }
			#szkopul-utils-dashboard-summary .mini-heatmap-wrap { overflow: hidden; padding-bottom: 4px; scrollbar-width: thin; }
			#szkopul-utils-dashboard-summary .mini-heatmap { scale: 1.17; display: grid; width: max-content; grid-template-rows: repeat(7, 9px); grid-auto-flow: column; grid-auto-columns: 9px; gap: 2px; }
			#szkopul-utils-dashboard-summary .mini-heatmap .cell { position: relative; top: 7px; left: 30px; width: 9px; height: 9px; border-radius: 2px; }
			@media (max-width: 991px) {
				#szkopul-utils-dashboard-summary .stats-grid-secondary { grid-template-columns: 1fr; }
				#szkopul-utils-dashboard-summary .mini-heatmap { grid-template-rows: repeat(7, 10px); grid-auto-columns: 10px; gap: 3px; }
				#szkopul-utils-dashboard-summary .mini-heatmap .cell { width: 10px; height: 10px; }
			}
		`;
		document.head.appendChild(style);
	}

	container.innerHTML = `
		<div class="card-header dashboard-panel-head">
			<h4 class="mb-0">Activity</h4>
		</div>
		<div class="card-body dashboard-card-body">
			<div class="stats-grid stats-grid-secondary">
				<div class="stats-grid-horizontal">
					<div class="stat-item"><b id="szkopul-utils-stat-last-month">${solvedLastMonth}</b>${t('dashboard_stats_lastMonth')}</div>
					<div class="stat-item"><b id="szkopul-utils-stat-total">${uniqueSolvedTasks.size}</b>${t('dashboard_stats_total')}</div>
					<div class="stat-item"><b id="szkopul-utils-stat-chars">${submittedCharsTotal}</b>${t('dashboard_stats_chars')}<span class="stat-extra" id="szkopul-utils-stat-chars-mb">(0.00 MB)</span></div>
					<div class="stat-item"><b id="szkopul-utils-stat-best">${bestDay}</b>${t('dashboard_stats_bestDay')}</div>
				</div>
				<div class="stats-grid-horizontal">
					<div class="stat-item"><b id="szkopul-utils-stat-today">${solvedToday}</b>${t('dashboard_stats_today')}</div>
					<div class="mini-heatmap-wrap"><div style="width: 100%; height: 100%;" class="mini-heatmap" id="szkopul-utils-mini-heatmap"></div></div>
					<button class="btn btn-sm btn-secondary" id="szkopul-utils-random-task-todo">${t('dashboard_randomTaskTODO')}</button>
				</div>
			</div>
		</div>
	`;

	submissionsPanel.appendChild(container);

	container.querySelector<HTMLButtonElement>('#szkopul-utils-random-task-todo')?.addEventListener('click', async () => {
		const item = await getRandomTODOItem();
		if (!item) {
			alert(t('popup_todo_empty'));
			return;
		}

		openTask(item.id);
	});

	let pinButton = document.createElement('divf');


	const heatmap = container.querySelector<HTMLDivElement>('#szkopul-utils-mini-heatmap');
	if (!heatmap) return;
	const heatCells = new Map<string, HTMLDivElement>();

	const weeks = window.matchMedia('(max-width: 991px)').matches ? 14 : 31;
	const totalCells = 7 * weeks;
	const start = new Date(today);
	start.setDate(start.getDate() - (totalCells - 1));
	const oldestShownDate = new Date(start);

	for (let i = 0; i < totalCells; i++) {
		const date = new Date(start);
		date.setDate(start.getDate() + i);
		const key = toDateKey(date);
		const value = solvedByDay.get(key) ?? 0;

		const cell = document.createElement('div');
		cell.className = 'cell';
		cell.style.background = getHeatColor(value);
		cell.title = `${key}: ${value}`;
		heatCells.set(key, cell);
		heatmap.appendChild(cell);
	}


	const lastMonthValue = container.querySelector<HTMLElement>('#szkopul-utils-stat-last-month');
	const todayValue = container.querySelector<HTMLElement>('#szkopul-utils-stat-today');
	const totalValue = container.querySelector<HTMLElement>('#szkopul-utils-stat-total');
	const charsValue = container.querySelector<HTMLElement>('#szkopul-utils-stat-chars');
	const charsMbValue = container.querySelector<HTMLElement>('#szkopul-utils-stat-chars-mb');
	const bestValue = container.querySelector<HTMLElement>('#szkopul-utils-stat-best');

	const updateStats = () => {
		if (lastMonthValue) lastMonthValue.textContent = String(solvedLastMonth);
		if (todayValue) todayValue.textContent = String(solvedToday);
		if (totalValue) totalValue.textContent = String(uniqueSolvedTasks.size);
		if (charsValue) charsValue.textContent = String(submittedCharsTotal);
		if (charsMbValue) charsMbValue.textContent = `(${(submittedCharsTotal / (1024 * 1024)).toFixed(2)} MB)`;
		if (bestValue) bestValue.textContent = String(bestDay);
	};

	const applySolvedEntry = (problemId: string, date: Date) => {
		const key = toDateKey(date);
		if (problemId) {
			const dedupeKey = `${problemId}|${key}`;
			if (emittedSolveKeys.has(dedupeKey)) return;
			emittedSolveKeys.add(dedupeKey);
		}

		solvedByDay.set(key, (solvedByDay.get(key) ?? 0) + 1);
		if (problemId) {
			uniqueSolvedTasks.add(problemId);
		}

		if (date >= monthAgo) solvedLastMonth += 1;
		solvedToday = solvedByDay.get(toDateKey(today)) ?? 0;
		bestDay = Math.max(0, ...Array.from(solvedByDay.values()));

		const cell = heatCells.get(key);
		if (cell) {
			const value = solvedByDay.get(key) ?? 0;
			cell.style.background = getHeatColor(value);
			cell.title = `${key}: ${value}`;
		}

		updateStats();
	};

	onTaskSolved((problemId, date) => {
		applySolvedEntry(problemId, date);
	});

	void (async () => {
		const historicalEntries = await getSolvedEntriesFromSubmissionsPages();
		for (const entry of historicalEntries) {
			if (entry.date < oldestShownDate && entry.date < monthAgo) continue;
			applySolvedEntry(entry.problemId, entry.date);
		}

		submittedCharsTotal = await getDashboardSubmittedCharsTotal();
		updateStats();
	})();

	// where did the skibidi thing go????????????????
}

export async function appendVirtualContestPanel() {
	const options = await getVirtualOptions();
	if (!options.isRunning || !options.startTime || options.duration <= 0) return;

	const endsAt = options.startTime + options.duration;
	if (endsAt <= Date.now()) {
		await saveVirtualOptions({ ...options, isRunning: false });
		return;
	}

	const panelId = 'szkopul-utils-virtual-panel';
	let panel = document.getElementById(panelId);
	if (!panel) {
		panel = document.createElement('div');
		panel.id = panelId;
		panel.style = `display: flex;flex-direction:column !important;position:fixed;top:150px;left:-3px;border:1px solid white;z-index:2147483647;width:250px;max-height:70vh;overflow-y:auto;background:rgb(255,255,255);color:rgb(33,37,41);border-radius:0 8px 8px 0;padding:10px;box-shadow:rgba(0,0,0,0.16) 0px 4px 14px;`;
		panel.innerHTML = `
			<div style="font-weight: 600; margin-bottom: 8px;">Virtual contest</div>
			<div id="szkopul-utils-virtual-panel-timer" style="font-size: 22px; margin-bottom: 8px;">00:00:00</div>
			<div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">${t('popup_virtual_scoreBy')}: ${options.scoreBy === 'last' ? t('popup_virtual_scoreBy_last') : t('popup_virtual_scoreBy_best')}</div>
			<div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">Tasks</div>
			<ul id="szkopul-utils-virtual-panel-tasks" style="padding-left: 18px; margin: 0;"></ul>
		`;
		document.body.appendChild(panel);
	}

	const tasks = await getVirtualTasks();
	const timer = panel.querySelector<HTMLDivElement>('#szkopul-utils-virtual-panel-timer');
	const tasksList = panel.querySelector<HTMLUListElement>('#szkopul-utils-virtual-panel-tasks');
	if (!timer || !tasksList) return;

	tasksList.innerHTML = '';

	if (tasks.length === 0) {
		const li = document.createElement('li');
		li.textContent = 'No tasks';
		tasksList.appendChild(li);
	} else {
		for (const task of tasks) {
			const li = document.createElement('li');
			li.style.marginTop = '4px';
			const link = document.createElement('a');
			link.href = `https://szkopul.edu.pl/problemset/problem/${encodeURIComponent(task.id)}/site/?key=statement`;
			link.rel = 'noopener noreferrer';
			link.textContent = task.name;
			li.appendChild(link);
			tasksList.appendChild(li);
		}
	}


	const updateTimer = async () => {
		const remaining = endsAt - Date.now();
		if (remaining <= 0) {
			if (virtualPanelIntervalId) window.clearInterval(virtualPanelIntervalId);
			virtualPanelIntervalId = 0;
			panel?.remove();
			await saveVirtualOptions({ ...options, isRunning: false });
			return;
		}
		timer.textContent = formatRemaining(remaining);
	};

	await updateTimer();
	if (virtualPanelIntervalId) window.clearInterval(virtualPanelIntervalId);
	virtualPanelIntervalId = window.setInterval(() => {
		void updateTimer();
	}, 1000);
}

