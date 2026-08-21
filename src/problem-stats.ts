import browser from 'webextension-polyfill';
import { DEBUG, t } from './globals';

const KEY_PROBLEM_STATS_CACHE = 'problemSolveStatsCache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_CONTESTS = 40;
const MAX_RANKING_PAGES = 60;
const FETCH_CONCURRENCY = 4;

type problemSolveStats = {
	solved: number,
	attempted: number,
};

type contestSolveStats = {
	fetchedAt: number,
	partial: boolean,
	stats: Record<string, problemSolveStats>,
};

type solveStatsCache = Record<string, contestSolveStats>;

type rankingPage = {
	shortNames: string[],
	rows: rankingCell[][],
	lastPage: number,
	hasNext: boolean,
};

type rankingCell = {
	score: number | null,
	fullScore: boolean,
};

function getProblemsTabContestId(pathname = window.location.pathname) {
	const match = pathname.match(/^\/c\/([^/]+)\/p\/?$/);
	return match ? decodeURIComponent(match[1]) : '';
}

async function readCache(): Promise<solveStatsCache> {
	const data = await browser.storage.local.get(KEY_PROBLEM_STATS_CACHE);
	const cache = data[KEY_PROBLEM_STATS_CACHE];
	if (!cache || typeof cache !== 'object' || Array.isArray(cache)) return {};
	return cache as solveStatsCache;
}

async function readCachedContestStats(contestId: string): Promise<contestSolveStats | null> {
	const entry = (await readCache())[contestId];
	if (!entry || typeof entry !== 'object') return null;
	if (typeof entry.fetchedAt !== 'number' || Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
	if (!entry.stats || typeof entry.stats !== 'object') return null;
	return entry;
}

async function writeCachedContestStats(contestId: string, entry: contestSolveStats) {
	const cache = await readCache();
	cache[contestId] = entry;

	const contestIds = Object.keys(cache);
	if (contestIds.length > CACHE_MAX_CONTESTS) {
		contestIds
			.sort((a, b) => (cache[a]?.fetchedAt ?? 0) - (cache[b]?.fetchedAt ?? 0))
			.slice(0, contestIds.length - CACHE_MAX_CONTESTS)
			.forEach((id) => delete cache[id]);
	}

	await browser.storage.local.set({[KEY_PROBLEM_STATS_CACHE]: cache});
}

async function fetchDocument(url: string) {
	const response = await fetch(url, {credentials: 'same-origin'});
	if (!response.ok) return null;
	return new DOMParser().parseFromString(await response.text(), 'text/html');
}

function parseScore(raw: string) {
	const text = raw.trim().replace(',', '.');
	if (!text) return null;
	const score = Number.parseFloat(text);
	return Number.isFinite(score) ? score : null;
}

function isFullScore(cell: HTMLTableCellElement, score: number | null) {
	if (cell.querySelector('.submission--OK100') || cell.classList.contains('submission--OK100')) return true;
	return score !== null && score >= 100;
}

function parseRankingPage(doc: Document): rankingPage | null {
	const table = doc.querySelector('table.table-ranking') ?? doc.querySelector('.nav-content table');
	if (!table) return null;

	const headers = [ ...table.querySelectorAll('thead th') ];
	const shortNames = headers.slice(3).map((th) => th.textContent?.trim() ?? '');
	if (shortNames.length === 0) return null;

	const rows: rankingCell[][] = [];
	for (const tr of table.querySelectorAll('tbody tr')) {
		const cells = [ ...tr.querySelectorAll('td') ].slice(3);
		if (cells.length === 0) continue;

		rows.push(cells.map((td) => {
			const score = parseScore(td.textContent ?? '');
			return {score, fullScore: isFullScore(td, score)};
		}));
	}

	const pageLinks = [ ...doc.querySelectorAll('ul.pagination .page-link') ];
	const lastPage = pageLinks.reduce((max, link) => {
		const page = Number.parseInt(link.textContent?.trim() ?? '', 10);
		return Number.isFinite(page) ? Math.max(max, page) : max;
	}, 1);

	const nextItem = [ ...doc.querySelectorAll('ul.pagination li.page-item') ].pop();
	const hasNext = !!nextItem && !nextItem.classList.contains('disabled');

	return {shortNames, rows, lastPage, hasNext};
}

function accumulatePage(stats: Record<string, problemSolveStats>, page: rankingPage) {
	for (const row of page.rows) {
		row.forEach((cell, index) => {
			const shortName = page.shortNames[index];
			if (!shortName || cell.score === null) return;

			const entry = stats[shortName] ?? (stats[shortName] = {solved: 0, attempted: 0});
			entry.attempted++;
			if (cell.fullScore) entry.solved++;
		});
	}
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
	const results: R[] = new Array(items.length);
	let nextIndex = 0;

	const runners = Array.from({length: Math.min(limit, items.length)}, async () => {
		while (nextIndex < items.length) {
			const index = nextIndex++;
			results[index] = await worker(items[index]);
		}
	});

	await Promise.all(runners);
	return results;
}

async function collectRanking(rankingPath: string, firstDoc: Document | null, stats: Record<string, problemSolveStats>) {
	const firstPage = firstDoc ? parseRankingPage(firstDoc) : null;
	if (!firstPage) return {partial: false, ok: false};

	accumulatePage(stats, firstPage);

	let partial = false;
	let fetchedPages = 1;
	let nextPage = 2;
	let lastKnownPage = firstPage.lastPage;
	let hasNext = firstPage.hasNext;

	while (hasNext) {
		if (fetchedPages >= MAX_RANKING_PAGES) {
			partial = true;
			break;
		}

		const batchEnd = Math.min(
			Math.max(lastKnownPage, nextPage),
			nextPage + FETCH_CONCURRENCY - 1,
			nextPage + (MAX_RANKING_PAGES - fetchedPages) - 1
		);

		const pageNumbers: number[] = [];
		for (let page = nextPage; page <= batchEnd; page++) pageNumbers.push(page);
		nextPage = batchEnd + 1;

		const pages = await mapWithConcurrency(pageNumbers, FETCH_CONCURRENCY, async (page) => {
			const doc = await fetchDocument(`${ rankingPath }?page=${ page }`);
			return doc ? parseRankingPage(doc) : null;
		});

		fetchedPages += pages.length;
		hasNext = false;

		for (const page of pages) {
			if (!page) continue;
			accumulatePage(stats, page);
			lastKnownPage = Math.max(lastKnownPage, page.lastPage);
			hasNext = hasNext || page.hasNext;
		}
	}

	return {partial, ok: true};
}

function collectRankingKeys(doc: Document, contestId: string) {
	const prefix = `/c/${ contestId }/ranking/`;
	const keys: string[] = [];

	for (const link of doc.querySelectorAll<HTMLAnchorElement>('.nav-pills a.nav-link')) {
		const path = new URL(link.href, window.location.origin).pathname;
		if (!path.startsWith(prefix)) continue;

		const key = path.slice(prefix.length).replace(/\/+$/, '');
		if (key && !keys.includes(key)) keys.push(key);
	}

	return keys;
}

async function fetchContestStats(contestId: string, wantedShortNames: string[]): Promise<contestSolveStats | null> {
	const rankingRoot = `/c/${ encodeURIComponent(contestId) }/ranking/`;
	const stats: Record<string, problemSolveStats> = {};

	const rootDoc = await fetchDocument(rankingRoot);
	if (!rootDoc) return null;

	const defaultRanking = await collectRanking(rankingRoot, rootDoc, stats);
	let partial = defaultRanking.partial;

	let missing = wantedShortNames.filter((name) => !(name in stats));
	if (missing.length > 0) {
		for (const key of collectRankingKeys(rootDoc, contestId)) {
			if (missing.length === 0) break;

			const roundPath = `${ rankingRoot }${ encodeURIComponent(key) }/`;
			const roundRanking = await collectRanking(roundPath, await fetchDocument(roundPath), stats);
			partial = partial || roundRanking.partial;
			missing = missing.filter((name) => !(name in stats));
		}
	}

	if (!defaultRanking.ok && Object.keys(stats).length === 0) return null;

	return {fetchedAt: Date.now(), partial, stats};
}

function makeCell() {
	const td = document.createElement('td');
	td.className = 'text-end utils-solve-count';
	td.style.whiteSpace = 'nowrap';
	return td;
}

function renderLoading(cell: HTMLTableCellElement) {
	cell.innerHTML = '<span class="text-muted"><i class="fa-solid fa-rotate-right spinner"></i></span>';
}

function renderStats(cell: HTMLTableCellElement, entry: problemSolveStats | undefined, partial: boolean) {
	if (!entry || entry.attempted === 0) {
		cell.textContent = '–';
		cell.title = t('problems_solved_noData');
		return;
	}

	cell.textContent = `${ entry.solved } / ${ entry.attempted }${ partial ? '+' : '' }`;
	cell.title = `${ entry.solved } ${ t('problems_solved_tooltipFull') }, ${ entry.attempted } ${ t('problems_solved_tooltipAny') }`
		+ (partial ? `\n${ t('problems_solved_tooltipPartial') }` : '');
}

export async function appendContestProblemSolveCounts() {
	const contestId = getProblemsTabContestId();
	if (!contestId || window.location.hostname !== 'szkopul.edu.pl') return;

	const table = document.querySelector<HTMLTableElement>('.table-responsive-md table');
	const headerRow = table?.querySelector<HTMLTableRowElement>('thead tr');
	if (!table || !headerRow || table.querySelector('.utils-solve-count')) return;

	const headerCells = [ ...headerRow.querySelectorAll('th') ];
	const lastHeader = headerCells[headerCells.length - 1];
	const insertBeforeLast = !!lastHeader && !lastHeader.textContent?.trim();

	const header = document.createElement('th');
	header.className = 'text-end utils-solve-count';
	header.textContent = t('problems_solved_header');
	header.title = t('problems_solved_headerTooltip');
	if (insertBeforeLast) headerRow.insertBefore(header, lastHeader);
	else headerRow.appendChild(header);

	const cellsByShortName = new Map<string, HTMLTableCellElement[]>();

	for (const row of table.querySelectorAll<HTMLTableRowElement>('tbody tr')) {
		const subheaderCell = row.querySelector<HTMLTableCellElement>('td[colspan]');
		if (row.classList.contains('problemlist-subheader') || (subheaderCell && row.children.length === 1)) {
			const colspan = Number.parseInt(subheaderCell?.getAttribute('colspan') ?? '', 10);
			if (subheaderCell && Number.isFinite(colspan)) subheaderCell.setAttribute('colspan', String(colspan + 1));
			continue;
		}

		const shortName = row.querySelector('td')?.textContent?.trim() || row.id.trim();
		if (!shortName) continue;

		const cell = makeCell();
		renderLoading(cell);

		const rowCells = [ ...row.querySelectorAll('td') ];
		const lastCell = rowCells[rowCells.length - 1];
		if (insertBeforeLast && lastCell) row.insertBefore(cell, lastCell);
		else row.appendChild(cell);

		cellsByShortName.set(shortName, [ ...(cellsByShortName.get(shortName) ?? []), cell ]);
	}

	if (cellsByShortName.size === 0) {
		header.remove();
		return;
	}

	const shortNames = [ ...cellsByShortName.keys() ];
	let entry = await readCachedContestStats(contestId);

	if (!entry) {
		try {
			entry = await fetchContestStats(contestId, shortNames);
			if (entry) await writeCachedContestStats(contestId, entry);
		} catch (error) {
			if (DEBUG) console.error('Szkopuł Utils: failed to read the ranking', error);
			entry = null;
		}
	}

	if (!entry) {
		header.remove();
		cellsByShortName.forEach((cells) => cells.forEach((cell) => cell.remove()));
		[ ...table.querySelectorAll<HTMLTableCellElement>('tbody tr.problemlist-subheader td[colspan]') ].forEach((td) => {
			const colspan = Number.parseInt(td.getAttribute('colspan') ?? '', 10);
			if (Number.isFinite(colspan)) td.setAttribute('colspan', String(colspan - 1));
		});
		return;
	}

	const stats = entry;
	cellsByShortName.forEach((cells, shortName) => {
		cells.forEach((cell) => renderStats(cell, stats.stats[shortName], stats.partial));
	});
}
