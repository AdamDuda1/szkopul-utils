import { problemSetMenuSeeNote } from './notes';
import { t } from './globals';
import { addVirtualTask, getVirtualOptions, getVirtualTasks, removeVirtualTask, saveVirtualOptions } from './virtual';

let virtualTasks: {id: string, name: string}[] = [];

function buildMenu(id: string, name: string, problemSet: boolean = true) {
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
					<span>${virtualTasks.some((t) => t.id === id) ? t('menu_removeFromVirtual') : t('menu_addToVirtual')}</span>
				</a>
				
				<a class="dropdown-item action-notes" href="#">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
						<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
						<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
					</svg>
					<span>Ujawnik wynik/Reveal score</span>
				</a>
				
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

export async function appendProblemSetMenu(addToTODOAction: (id: string, name: string, btn: HTMLAnchorElement) => void) {
	virtualTasks = await getVirtualTasks();

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

		if (id != undefined) {
			const cell = document.createElement('td');

			const renderCell = () => {
				cell.innerHTML = buildMenu(id, name!, true);
				attachHandlers();
			};

			const attachHandlers = () => {
				let virtualActionInProgress = false;

				cell.querySelector<HTMLAnchorElement>('.action-todo')?.addEventListener('click', (event) => {
					event.preventDefault();
					event.stopPropagation();

					addToTODOAction(id, name!, event.currentTarget as HTMLAnchorElement);

					setTimeout(() => {
						tr.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
						cell.innerHTML = buildMenu(id, name!, true);
					}, 1000);
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

				cell.querySelector<HTMLAnchorElement>('.action-notes')?.addEventListener('click', (event) => {
					event.preventDefault();
					problemSetMenuSeeNote(id, name!);
				});
			};

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
		panel.style = `
			position: fixed;
			top: 150px;
			left: -3px;
			border: 1px solid white;
			z-index: 2147483647;
			width: 250px;
			max-height: 70vh;
			overflow-y: auto;
			background: rgb(255, 255, 255);
			color: rgb(33, 37, 41);
			border-radius: 0 8px 8px 0;
			padding: 10px;
			box-shadow: rgba(0, 0, 0, 0.16) 0px 4px 14px;
    	`;
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

