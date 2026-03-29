import { problemSetMenuSeeNote } from './notes';
import { DEBUG, t, contest, task } from './globals';
import { getRandomTODOItem, getTODO } from './todo';
import { addVirtualTask, getVirtualOptions, getVirtualTasks, removeVirtualTask, saveVirtualOptions } from './virtual';
import { getOptions, getPinnedContests, optionsTemplate, savePinnedContests } from './options';
import browser from 'webextension-polyfill';

let optionsObject: optionsTemplate;
let pinnedContests: contest[];
let virtualTasks: task[] = [];
let todoTaskIds = new Set<string>();
const TASK_SOLVED_EVENT = 'szkopul-utils:taskSolved';
const KEY_TASK_SOLVED_HISTORY = 'taskSolvedHistory';
const KEY_TASK_SOLVED_PENDING = 'szkopul-utils:taskSolvedPending';
const KEY_SUBMITTED_CHARS_PENDING = 'szkopul-utils:submittedCharsPending';

type SolvedHistoryEntry = {
	problemId: string;
	solvedAt: string;
};

type TaskSolvedEventPayload = {
	problemId?: string;
	solvedAt?: string | number | Date;
};

function normalizeProblemId(problemId = '') {
	const trimmed = problemId.trim();
	if (!trimmed) return '';

	const normalizeFromPath = (pathname: string) => {
		const fromProblemset = pathname.match(/\/problemset\/problem\/([^/]+)/)?.[1];
		if (fromProblemset) return decodeURIComponent(fromProblemset);
		const fromSubmit = pathname.match(/\/submit\/([^/]+)/)?.[1];
		if (fromSubmit) return decodeURIComponent(fromSubmit);
		return '';
	};

	try {
		const url = new URL(trimmed, window.location.origin);
		return normalizeFromPath(url.pathname) || trimmed.replace(/\/+$/, '');
	} catch {
		return normalizeFromPath(trimmed) || trimmed.replace(/\/+$/, '');
	}
}

export function emitTaskSolved(problemId = '', chars: number, solvedAt = new Date()) {
	const parsedSolvedAt = parseTaskSolvedDate(solvedAt) ?? new Date();
	const normalizedProblemId = normalizeProblemId(problemId);
	const normalizedChars = Number.isFinite(chars) && chars > 0 ? Math.floor(chars) : 0;
	queuePendingSolvedEntry(normalizedProblemId, parsedSolvedAt);
	if (normalizedChars > 0) queuePendingSubmittedChars(normalizedChars);
	void flushPendingSolvedHistory();
	if (normalizedChars > 0) void flushPendingSubmittedChars();

	window.dispatchEvent(new CustomEvent(TASK_SOLVED_EVENT, {
		detail: {problemId: normalizedProblemId, solvedAt: parsedSolvedAt.toISOString()}
	}));
}

function queuePendingSubmittedChars(chars: number) {
	if (!Number.isFinite(chars) || chars <= 0) return;

	try {
		const current = Number(localStorage.getItem(KEY_SUBMITTED_CHARS_PENDING) ?? '0');
		const safeCurrent = Number.isFinite(current) && current > 0 ? Math.floor(current) : 0;
		localStorage.setItem(KEY_SUBMITTED_CHARS_PENDING, String(safeCurrent + Math.floor(chars)));
	} catch {
		// ignore localStorage write issues
	}
}

async function flushPendingSubmittedChars() {
	let pendingChars = 0;
	try {
		const raw = Number(localStorage.getItem(KEY_SUBMITTED_CHARS_PENDING) ?? '0');
		pendingChars = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
		if (pendingChars <= 0) return;
		localStorage.removeItem(KEY_SUBMITTED_CHARS_PENDING);
	} catch {
		return;
	}

	try {
		const data = await browser.storage.local.get('submittedCharsTotal');
		const current = pickStoredNumber(data.submittedCharsTotal);
		await browser.storage.local.set({submittedCharsTotal: current + pendingChars});
	} catch {
		queuePendingSubmittedChars(pendingChars);
	}
}

function queuePendingSolvedEntry(problemId: string, solvedAt: Date) {
	if (!problemId) return;

	try {
		const raw = localStorage.getItem(KEY_TASK_SOLVED_PENDING);
		const pending = Array.isArray(JSON.parse(raw ?? '[]')) ? JSON.parse(raw ?? '[]') as unknown[] : [];
		const normalizedPending = pending.filter((entry) => {
			if (!entry || typeof entry !== 'object') return false;
			const item = entry as Partial<SolvedHistoryEntry>;
			return typeof item.problemId === 'string' && typeof item.solvedAt === 'string';
		});
		normalizedPending.push({problemId, solvedAt: solvedAt.toISOString()});
		localStorage.setItem(KEY_TASK_SOLVED_PENDING, JSON.stringify(normalizedPending));
	} catch {
		// ignore localStorage write issues
	}
}

async function flushPendingSolvedHistory() {
	let pending: SolvedHistoryEntry[] = [];
	try {
		const raw = localStorage.getItem(KEY_TASK_SOLVED_PENDING);
		const parsed = JSON.parse(raw ?? '[]');
		if (!Array.isArray(parsed) || parsed.length === 0) return;
		pending = parsed.filter((entry) => {
			if (!entry || typeof entry !== 'object') return false;
			const item = entry as Partial<SolvedHistoryEntry>;
			return typeof item.problemId === 'string' && typeof item.solvedAt === 'string';
		}) as SolvedHistoryEntry[];
		if (pending.length === 0) {
			localStorage.removeItem(KEY_TASK_SOLVED_PENDING);
			return;
		}
	} catch {
		return;
	}

	for (const entry of pending) {
		const parsedDate = parseDate(entry.solvedAt);
		if (!parsedDate) continue;
		await appendSolvedHistoryEntry(entry.problemId, parsedDate);
	}

	try {
		localStorage.removeItem(KEY_TASK_SOLVED_PENDING);
	} catch {
		// ignore localStorage cleanup issues
	}
}

async function appendSolvedHistoryEntry(problemId: string, solvedAt: Date) {
	if (!problemId) return;

	const data = await browser.storage.local.get(KEY_TASK_SOLVED_HISTORY);
	const rawHistory = data[KEY_TASK_SOLVED_HISTORY];
	const history = Array.isArray(rawHistory) ? rawHistory : [];

	const dayKey = toDateKey(solvedAt);
	const dedupeKey = `${ problemId }|${ dayKey }`;
	const dedupedHistory = history.filter((entry) => {
		if (!entry || typeof entry !== 'object') return false;
		const normalized = entry as Partial<SolvedHistoryEntry>;
		if (typeof normalized.problemId !== 'string') return false;
		if (typeof normalized.solvedAt !== 'string') return false;
		const parsedDate = parseDate(normalized.solvedAt);
		if (!parsedDate) return false;
		return `${ normalized.problemId }|${ toDateKey(parsedDate) }` !== dedupeKey;
	});

	dedupedHistory.push({problemId, solvedAt: solvedAt.toISOString()});
	await browser.storage.local.set({[KEY_TASK_SOLVED_HISTORY]: dedupedHistory});
}

async function getSolvedDashboardEntries() {
	await flushPendingSolvedHistory();

	const data = await browser.storage.local.get(KEY_TASK_SOLVED_HISTORY);
	const rawHistory = data[KEY_TASK_SOLVED_HISTORY];
	const source = Array.isArray(rawHistory) ? rawHistory : [];

	const entries: Array<{problemId: string, date: Date}> = [];
	for (const entry of source) {
		if (!entry || typeof entry !== 'object') continue;
		const normalized = entry as Partial<SolvedHistoryEntry>;
		if (typeof normalized.problemId !== 'string' || typeof normalized.solvedAt !== 'string') continue;
		const parsedDate = parseDate(normalized.solvedAt);
		if (!parsedDate) continue;
		parsedDate.setHours(0, 0, 0, 0);
		entries.push({problemId: normalizeProblemId(normalized.problemId), date: parsedDate});
	}

	return entries;
}

function pickStoredNumber(...values: unknown[]) {
	for (const value of values) {
		if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
	}
	return 0;
}

async function getDashboardStoredStats() {
	await flushPendingSubmittedChars();

	const data = await browser.storage.local.get(null);
	const nestedStats = (data.dashboardStats && typeof data.dashboardStats === 'object') ? data.dashboardStats as Record<string, unknown> : {};

	const submittedCharsTotal = pickStoredNumber(
		data.submittedCharsTotal,
		data.submittedChars,
		data.charsSubmitted,
		nestedStats.submittedCharsTotal,
		nestedStats.submittedChars,
		nestedStats.charsSubmitted,
	);

	const solvedSiteTotal = pickStoredNumber(
		data.solvedSiteTotal,
		data.siteSolvedTotal,
		data.solvedTotal,
		data.site,
		nestedStats.solvedSiteTotal,
		nestedStats.siteSolvedTotal,
		nestedStats.solvedTotal,
		nestedStats.site,
	);

	return {submittedCharsTotal, solvedSiteTotal};
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
					<span>${ todoTaskIds.has(id) ? t('menu_removeFromTODO') : t('menu_addToTODO') }</span>
				</a>
				
				<a class="dropdown-item action-virtual" href="#">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock" viewBox="0 0 16 16">
						<path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
						<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
					</svg>
					<span>${ virtualTasks.some((t) => t.id === id) ? t('menu_removeFromVirtual') : t('menu_addToVirtual') }</span>
				</a>
				
				${
		revealScoreButton ?
			`
					<a class = "dropdown-item action-score" href="#">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
							<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
							<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
						</svg>
						<span>${ t('menu_revealScore') }</span>
					</a>
				` : ``
	}
				
				<a class="dropdown-item action-notes" href="#">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
						<path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
					</svg>
					<span>${ t('menu_viewNote') }</span>
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
							setLabel(t('menu_removed'));
						} else {
							await addVirtualTask(id, name!);
							setLabel(t('menu_added'));
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
	return `${ hours.toString().padStart(2, '0') }:${ minutes.toString().padStart(2, '0') }:${ seconds.toString().padStart(2, '0') }`;
}

let virtualPanelIntervalId = 0;

function toDateKey(date: Date) {
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	return `${ yyyy }-${ mm }-${ dd }`;
}

function parseDate(raw: string) {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const parsed = new Date(trimmed);
	if (!Number.isNaN(parsed.getTime())) return parsed;

	const monthDayMatch = trimmed.match(/^(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
	if (monthDayMatch) {
		let year = new Date().getFullYear();
		const [ , mm, dd, hh, min, ss ] = monthDayMatch;
		let monthDayParsed = new Date(year, Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
		if (monthDayParsed.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
			year -= 1;
			monthDayParsed = new Date(year, Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
		}
		if (!Number.isNaN(monthDayParsed.getTime())) return monthDayParsed;
	}

	const dotMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
	if (!dotMatch) return null;

	const [ , dd, mm, yyyy ] = dotMatch;
	const dotParsed = new Date(`${ yyyy }-${ mm }-${ dd }T00:00:00`);
	return Number.isNaN(dotParsed.getTime()) ? null : dotParsed;
}

function getHeatColor(value: number) {
	if (value <= 0) return '#2d333b';
	if (value === 1) return '#0e4429';
	if (value <= 3) return '#006d32';
	if (value <= 6) return '#26a641';
	return '#39d353';
}

const pinButton = (q: HTMLDivElement, thisContest: contest) => {
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

export async function pinContestButtonInContest() {
	pinnedContests = await getPinnedContests();
	let title = document.querySelector('.row .col-lg-9.col-xl-10.main-content h1') as HTMLElement;

	let thisContest: contest = {name: (title as HTMLElement).innerText, href: window.location.href.slice(0, -10), slug: ''};

	let btnDiv = document.createElement('div');
	title.style.display = 'flex';
	btnDiv.addEventListener('mouseenter', () => btnDiv.style.color = 'orange');
	btnDiv.addEventListener('mouseleave', () => btnDiv.style.color = 'gray');
	btnDiv.style = 'display: flex; position: relative; top: 24px; left: 15px; scale: 1.5; cursor: pointer; color: gray;';
	btnDiv.setAttribute('data-pin-button-href', thisContest.href);

	btnDiv.addEventListener('click', () => {
		const isPinned = pinnedContests.some((c) => c.href === thisContest.href);
		if (isPinned) pinnedContests = pinnedContests.filter((c) => c.href !== thisContest.href);
		else pinnedContests.push(thisContest);

		savePinnedContests(pinnedContests);
		pinButton(btnDiv, thisContest);
		const container = document.getElementById('szkopul-utils-pinned-contests') as HTMLDivElement;
		if (container) {
			renderPinnedContests(container);
			pinContestButtons();
		}
		updateAllPinButtons();
	});

	pinButton(btnDiv, thisContest);

	title.append(btnDiv);
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

		btnDiv.addEventListener('click', () => {
			const isPinned = pinnedContests.some((c) => c.href === thisContest.href);
			if (isPinned) pinnedContests = pinnedContests.filter((c) => c.href !== thisContest.href);
			else pinnedContests.push(thisContest);

			savePinnedContests(pinnedContests);
			pinButton(btnDiv, thisContest);
			const container = document.getElementById('szkopul-utils-pinned-contests') as HTMLDivElement;
			if (container) {
				renderPinnedContests(container);
				pinContestButtons();
			}
			updateAllPinButtons();
		});

		pinButton(btnDiv, thisContest);

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
				<td>${ contest.slug }</td>
				<td><a href="${ contest.href }">${ contest.name }</a></td>
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
	container.innerHTML = '<table class="table break-all-words"></table>';

	renderPinnedContests(container);

	rightPanel.prepend(container);
	rightPanel.prepend(header);
}

export function appendHomeDashboardSummary() {
	if (document.getElementById('szkopul-utils-dashboard-summary')) return;

	const submissionsTable = document.querySelector<HTMLTableElement>('table.submission');
	const submissionsPanel = submissionsTable?.closest<HTMLElement>('.dashboard-panel');
	if (!submissionsPanel) return;

	const solvedByDay = new Map<string, number>();
	const uniqueSolvedTasks = new Set<string>();

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const monthAgo = new Date(today);
	monthAgo.setDate(monthAgo.getDate() - 29);

	let solvedLastMonth = 0;
	let solvedToday = 0;
	let bestDay = 0;
	const emittedSolveKeys = new Set<string>();
	let solvedSiteTotal = 0;

	const openTask = (id: string) => {
		if (!id) return;
		window.location.href = `https://szkopul.edu.pl/problemset/problem/${ encodeURIComponent(id) }/site/?key=statement`;
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
					<div class="stat-item"><b id="szkopul-utils-stat-last-month">${ solvedLastMonth }</b>${ t('dashboard_stats_lastMonth') }</div>
					<div class="stat-item"><b id="szkopul-utils-stat-total">${ uniqueSolvedTasks.size }</b>${ t('dashboard_stats_total') }</div>
					<div class="stat-item"><b id="szkopul-utils-stat-chars">${ submittedCharsTotal }</b>${ t('dashboard_stats_chars') }<span class="stat-extra" id="szkopul-utils-stat-chars-mb">(0.00 MB)</span></div>
					<div class="stat-item"><b id="szkopul-utils-stat-best">${ bestDay }</b>${ t('dashboard_stats_bestDay') }</div>
				</div>
				<div class="stats-grid-horizontal">
					<div class="stat-item"><b id="szkopul-utils-stat-today">${ solvedToday }</b>${ t('dashboard_stats_today') }</div>
					<div class="mini-heatmap-wrap"><div style="width: 100%; height: 100%;" class="mini-heatmap" id="szkopul-utils-mini-heatmap"></div></div>
					<button class="btn btn-sm btn-secondary" id="szkopul-utils-random-task-todo">${ t('dashboard_randomTaskTODO') }</button>
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
		cell.title = `${ key }: ${ value }`;
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
		if (totalValue) totalValue.textContent = String(solvedSiteTotal || uniqueSolvedTasks.size);
		if (charsValue) charsValue.textContent = String(submittedCharsTotal);
		if (charsMbValue) charsMbValue.textContent = `(${ (submittedCharsTotal / (1024 * 1024)).toFixed(2) } MB)`;
		if (bestValue) bestValue.textContent = String(bestDay);
	};

	const applySolvedEntry = (problemId: string, date: Date) => {
		const key = toDateKey(date);
		if (problemId) {
			const dedupeKey = `${ problemId }|${ key }`;
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
			cell.title = `${ key }: ${ value }`;
		}

		updateStats();
	};

	onTaskSolved((problemId, date) => {
		applySolvedEntry(problemId, date);
	});

	void (async () => {
		const historicalEntries = await getSolvedDashboardEntries();
		for (const entry of historicalEntries) {
			if (entry.date < oldestShownDate && entry.date < monthAgo) continue;
			applySolvedEntry(entry.problemId, entry.date);
		}

		const storedStats = await getDashboardStoredStats();
		submittedCharsTotal = storedStats.submittedCharsTotal;
		solvedSiteTotal = storedStats.solvedSiteTotal;
		updateStats();
	})();

	// where did the skibidi thing go????????????????
}

export async function appendVirtualContestPanel() {
	const options = await getVirtualOptions();
	if (!options.isRunning || !options.startTime || options.duration <= 0) return;

	const endsAt = options.startTime + options.duration;
	if (endsAt <= Date.now()) {
		await saveVirtualOptions({...options, isRunning: false});
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
			<div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">${ t('popup_virtual_scoreBy') }: ${ options.scoreBy === 'last' ? t('popup_virtual_scoreBy_last') : t('popup_virtual_scoreBy_best') }</div>
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
			link.href = `https://szkopul.edu.pl/problemset/problem/${ encodeURIComponent(task.id) }/site/?key=statement`;
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
			await saveVirtualOptions({...options, isRunning: false});
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

function openArchiveVirtualContestModal(tasks: task[]) {
	if (tasks.length === 0) {
		alert('Oh, no! Brak zadań w tej grupie!');
		return;
	}

	document.getElementById('szkopul-utils-archive-virtual-modal')?.remove();

	const host = document.createElement('div');
	host.id = 'szkopul-utils-archive-virtual-modal';
	host.innerHTML = `
		<div id="szkopul-utils-archive-virtual-overlay" style="position: fixed; top: 0; left: 0; z-index: 2147483647; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.24);">
			<div id="szkopul-utils-archive-virtual-content" style="background: ${ (localStorage.getItem('dark-mode') === 'enabled' ? '#181a1b' : 'white') }; color: ${ (localStorage.getItem('dark-mode') === 'enabled' ? '#f8f9fa' : '#212529') }; padding: 16px; border-radius: 12px; width: min(520px, 90vw); box-shadow: 0 8px 32px rgba(0,0,0,0.28);">
				<p style="margin: 0 0 6px 0;">${ t('archive_replaceTaskInVirtual') } <br> ${t("archive_tasksToAdd")} ${ tasks.length }</p>
				<div style="display: flex; gap: 8px; justify-content: flex-end;">
					<button type="button" class="btn btn-primary" id="szkopul-utils-archive-virtual-replace">${t("archive_yes")}</button>
					<button type="button" class="btn btn-outline-primary" id="szkopul-utils-archive-virtual-add">${t("archive_justAdd")}</button>
					<button type="button" class="btn btn-secondary" id="szkopul-utils-archive-virtual-cancel">${t("archive_cancel")}</button>
				</div>
			</div>
		</div>
	`;
	document.body.appendChild(host);

	const overlay = host.querySelector<HTMLDivElement>('#szkopul-utils-archive-virtual-overlay');
	const content = host.querySelector<HTMLDivElement>('#szkopul-utils-archive-virtual-content');
	const replaceButton = host.querySelector<HTMLButtonElement>('#szkopul-utils-archive-virtual-replace');
	const addButton = host.querySelector<HTMLButtonElement>('#szkopul-utils-archive-virtual-add');
	const cancelButton = host.querySelector<HTMLButtonElement>('#szkopul-utils-archive-virtual-cancel');

	const closeModal = () => {
		document.removeEventListener('keydown', onKeyDown);
		host.remove();
	};

	const applyTasks = async (replaceExisting: boolean) => {
		const pendingTasks = tasks.filter((item) => item.id);
		if (pendingTasks.length === 0) {
			closeModal();
			return;
		}

		if (replaceExisting) {
			const existing = await getVirtualTasks();
			for (const existingTask of existing) {
				await removeVirtualTask(existingTask.id);
			}
		}

		const nowExistingIds = new Set((await getVirtualTasks()).map((item) => item.id));
		for (const archiveTask of pendingTasks) {
			if (nowExistingIds.has(archiveTask.id)) continue;
			await addVirtualTask(archiveTask.id, archiveTask.name);
			nowExistingIds.add(archiveTask.id);
		}

		closeModal();
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') closeModal();
	};

	overlay?.addEventListener('click', closeModal);
	content?.addEventListener('click', (event) => event.stopPropagation());
	replaceButton?.addEventListener('click', () => {
		void applyTasks(true);
	});
	addButton?.addEventListener('click', () => {
		void applyTasks(false);
	});
	cancelButton?.addEventListener('click', closeModal);
	document.addEventListener('keydown', onKeyDown);
}

export function taskArchive() {
	const headers = document.querySelectorAll<HTMLDivElement>('.problemgroup-heading');

	let first: boolean = true;

	headers.forEach(header => {
		if (first) {
			header.innerHTML = t("archive_forAll");
			first = false;
		}

		header.querySelectorAll<HTMLElement>('i.link-getter').forEach(e => e.style.display = 'none');

		const tasks: task[] = [];
		(header.nextElementSibling as HTMLElement | null)?.querySelectorAll<HTMLAnchorElement>('td a').forEach((a) => {
			const href = a.href;
			const id = href.match(/\/problemset\/problem\/([^/]+)/)?.[1] ?? '';
			if (!id) return;
			tasks.push({id: decodeURIComponent(id), name: a.textContent?.trim() || decodeURIComponent(id)});
		});
		const taskUrls = tasks.map((item) => `https://szkopul.edu.pl/problemset/problem/${ encodeURIComponent(item.id) }/site/?key=statement`);

		const randomButton = document.createElement('button');
		randomButton.classList.add('btn', 'btn-sm');
		randomButton.style = 'position: relative; top: -2px;';
		randomButton.title = t("archive_random");
		randomButton.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-shuffle" viewBox="0 0 16 16">
				<path fill-rule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5"/>
				<path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192"/>
			</svg>
		`;
		randomButton.addEventListener('click', () => {
			if (taskUrls.length === 0) { alert('Oh, no! Brak zadań w tej grupie!'); return; }
			const randomTask = taskUrls[Math.floor(Math.random() * taskUrls.length)];
			window.open(randomTask, '_blank');
		});

		const contestButton = document.createElement('button');
		contestButton.classList.add('btn', 'btn-sm');
		contestButton.style = 'position: relative; top: -2px;';
		contestButton.title = t("archive_contest");
		contestButton.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stopwatch" viewBox="0 0 16 16">
				<path d="M8.5 5.6a.5.5 0 1 0-1 0v2.9h-3a.5.5 0 0 0 0 1H8a.5.5 0 0 0 .5-.5z"/>
				<path d="M6.5 1A.5.5 0 0 1 7 .5h2a.5.5 0 0 1 0 1v.57c1.36.196 2.594.78 3.584 1.64l.012-.013.354-.354-.354-.353a.5.5 0 0 1 .707-.708l1.414 1.415a.5.5 0 1 1-.707.707l-.353-.354-.354.354-.013.012A7 7 0 1 1 7 2.071V1.5a.5.5 0 0 1-.5-.5M8 3a6 6 0 1 0 .001 12A6 6 0 0 0 8 3"/>
			</svg>
		`;
		contestButton.addEventListener('click', () => {
			openArchiveVirtualContestModal(tasks);
		});

		header.appendChild(randomButton);
		header.appendChild(contestButton);
	});
}