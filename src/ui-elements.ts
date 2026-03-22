import { problemSetMenuSeeNote } from './notes';
import { t } from './globals';
import { getRandomTODOItem, getTODO } from './todo';
import { addVirtualTask, getVirtualOptions, getVirtualTasks, removeVirtualTask, saveVirtualOptions, task } from './virtual';
import { getOptions, optionsTemplate } from './options';

let optionsObject: optionsTemplate;
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
	return date.toISOString().slice(0, 10);
}

function parseDate(raw: string) {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const parsed = new Date(trimmed);
	if (!Number.isNaN(parsed.getTime())) return parsed;

	const dotMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
	if (!dotMatch) return null;

	const [, dd, mm, yyyy] = dotMatch;
	const dotParsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
	return Number.isNaN(dotParsed.getTime()) ? null : dotParsed;
}

function getSolvedDashboardEntries() {
	const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('.szkopul-dashboard__container tr'));
	const entries: { date: Date; problemId: string }[] = [];

	for (const row of rows) {
		const text = row.textContent?.toLowerCase() ?? '';
		if (!/(\b100\b|accepted|\bok\b|zaakcept|poprawne|\bac\b)/.test(text)) continue;

		const href = row.querySelector<HTMLAnchorElement>('a[href*="/problemset/problem/"]')?.href ?? '';
		const problemId = href.match(/\/problemset\/problem\/([^/]+)/)?.[1] ?? '';

		const dateRaw = row.querySelector('time')?.getAttribute('datetime')
			?? row.querySelector('time')?.textContent
			?? Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim() ?? '').find((value) => value.length > 4)
			?? '';

		const parsedDate = parseDate(dateRaw);
		if (!parsedDate) continue;

		parsedDate.setHours(0, 0, 0, 0);
		entries.push({ date: parsedDate, problemId });
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

export function appendHomeDashboardSummary() {
	if (window.location.hostname !== 'szkopul.edu.pl') return;
	if (window.location.pathname !== '/') return;

	const anchor = document.querySelector<HTMLElement>('.szkopul-dashboard__container div');
	if (!anchor || document.getElementById('szkopul-utils-dashboard-summary')) return;

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

	const container = document.createElement('section');
	container.id = 'szkopul-utils-dashboard-summary';
		  container.style.cssText = 'margin-top:8px;padding:10px;border:1px solid #d5d7da;border-radius:8px;background:#fff';

	const style = document.createElement('style');
	style.textContent = `
		#szkopul-utils-dashboard-summary .layout { display:flex; align-items:stretch; gap:14px; min-height:88px; }
		#szkopul-utils-dashboard-summary .heatmap { height:auto; width:auto; display:grid; grid-template-rows:repeat(7,10px); grid-auto-flow:column; grid-auto-columns:10px; gap:3px; flex:0 0 auto; }
		#szkopul-utils-dashboard-summary .heatmap .cell { width:10px; height:10px; border-radius:2px; }
		#szkopul-utils-dashboard-summary .right-column { display:flex; flex-direction:row; justify-content:space-between; align-items:flex-start; gap:12px; min-width:240px; flex:1; }
		#szkopul-utils-dashboard-summary .stats { display:flex; gap:12px; flex-wrap:wrap; }
		#szkopul-utils-dashboard-summary .stats > div { display:flex; flex-direction:column; gap:6px; }
		#szkopul-utils-dashboard-summary .stat { line-height:1.25; margin:0; }
		#szkopul-utils-dashboard-summary .stat b { display:block; font-size:17px; line-height:1.1; margin-bottom:2px; }
		#szkopul-utils-dashboard-summary .actions { display:flex; flex-wrap:wrap; gap:8px; flex-direction:column; }
		@media (max-width: 900px) {
			#szkopul-utils-dashboard-summary .layout { flex-direction:column; gap:10px; min-height:auto; }
			#szkopul-utils-dashboard-summary .right-column { min-width:0; width:100%; flex-direction:column; gap:10px; }
			#szkopul-utils-dashboard-summary .heatmap { width:100%; aspect-ratio:26/7; grid-template-rows:repeat(7,minmax(0,1fr)); grid-auto-columns:minmax(0,1fr); gap:2px; }
			#szkopul-utils-dashboard-summary .heatmap .cell { width:100%; height:100%; }
			#szkopul-utils-dashboard-summary .stats { width:100%; justify-content:space-between; gap:10px; }
			#szkopul-utils-dashboard-summary .stats > div { flex:1 1 0; min-width:120px; }
			#szkopul-utils-dashboard-summary .actions { width:100%; flex-direction:row; }
			#szkopul-utils-dashboard-summary .actions .btn { flex:1 1 140px; }
		}
`;
	container.appendChild(style);

	const layout = document.createElement('div');
	layout.className = 'layout';

	const rightColumn = document.createElement('div');
	rightColumn.className = 'right-column';

	const stats = document.createElement('div');
	stats.className = 'stats';
	stats.innerHTML = `
		<div><div class="stat"><b id="szkopul-utils-stat-last-month">${solvedLastMonth}</b>${t('dashboard_stats_lastMonth')}</div>
		<div class="stat"><b id="szkopul-utils-stat-today">${solvedToday}</b>${t('dashboard_stats_today')}</div></div>
		<div><div class="stat"><b id="szkopul-utils-stat-total">${uniqueSolvedTasks.size}</b>${t('dashboard_stats_total')}</div>
		<div class="stat"><b id="szkopul-utils-stat-best">${bestDay}</b>${t('dashboard_stats_bestDay')}</div></div>
	`;

	const actions = document.createElement('div');
	actions.className = 'actions';
	actions.innerHTML = `
		<button class="btn btn-secondary" id="szkopul-utils-random-task-todo">${t('dashboard_randomTaskTODO')}</button>
		<button class="btn btn-secondary" id="szkopul-utils-see-stats">${t('dashboard_seeStats')}</button>
	`;

	actions.querySelector<HTMLButtonElement>('#szkopul-utils-random-task-todo')?.addEventListener('click', async () => {
		const item = await getRandomTODOItem();
		if (!item) {
			alert(t('popup_todo_empty'));
			return;
		}

		openTask(item.id);
	});

	actions.querySelector<HTMLButtonElement>('#szkopul-utils-see-stats')?.addEventListener('click', () => {
		alert(`Stats:\nSolved last month: ${solvedLastMonth}\nSolved today: ${solvedToday}\nTotal solved: ${uniqueSolvedTasks.size}\nBest day: ${bestDay}`);
	});

	const heatmap = document.createElement('div');
	heatmap.className = 'heatmap';
	const heatCells = new Map<string, HTMLDivElement>();

	const totalCells = 7 * 26;
	const start = new Date(today);
	start.setDate(start.getDate() - (totalCells - 1));

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

	const lastMonthValue = stats.querySelector<HTMLSpanElement>('#szkopul-utils-stat-last-month');
	const todayValue = stats.querySelector<HTMLSpanElement>('#szkopul-utils-stat-today');
	const totalValue = stats.querySelector<HTMLSpanElement>('#szkopul-utils-stat-total');
	const bestValue = stats.querySelector<HTMLSpanElement>('#szkopul-utils-stat-best');

	const updateStats = () => {
		if (lastMonthValue) lastMonthValue.textContent = String(solvedLastMonth);
		if (todayValue) todayValue.textContent = String(solvedToday);
		if (totalValue) totalValue.textContent = String(uniqueSolvedTasks.size);
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

	rightColumn.append(stats, actions);
	layout.append(heatmap, rightColumn);
	container.append(layout);
	anchor.insertAdjacentElement('afterend', container);
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
		panel.style = `display: flex;position:fixed;top:150px;left:-3px;border:1px solid white;z-index:2147483647;width:250px;max-height:70vh;overflow-y:auto;background:rgb(255,255,255);color:rgb(33,37,41);border-radius:0 8px 8px 0;padding:10px;box-shadow:rgba(0,0,0,0.16) 0px 4px 14px;`;
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

