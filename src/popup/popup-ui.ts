import { html, render } from 'lit';
import { type lang, t } from '../globals.js';
// import { init, initLang } from './popup';

const browserFunctions = true; // Set this to false to test UI locally

setTimeout(async () => {
	// if (browserFunctions) await initLang();
	renderPopup();
	// if (browserFunctions) await init();
}, 10);

export function backHome() {
	document.getElementById('home')!.style.display = 'flex';
	document.getElementById('todo')!.style.display = 'none';
	document.getElementById('virtual')!.style.display = 'none';
	document.getElementById('options')!.style.display = 'none';
}

export function showVirtual() {
	document.getElementById('home')!.style.display = 'none';
	document.getElementById('todo')!.style.display = 'none';
	document.getElementById('virtual')!.style.display = 'flex';
	document.getElementById('options')!.style.display = 'none';
}

export function showTODO() {
	document.getElementById('home')!.style.display = 'none';
	document.getElementById('todo')!.style.display = 'flex';
	document.getElementById('options')!.style.display = 'none';
	document.getElementById('virtual')!.style.display = 'none';
	// void renderTODOTable();
}

export function showOptions() {
	document.getElementById('options')!.style.display = 'flex';
	document.getElementById('virtual')!.style.display = 'none';
	document.getElementById('home')!.style.display = 'none';
	document.getElementById('todo')!.style.display = 'none';
}

export function renderPopup() {
render(
	html`
        <h2>Szkopuł Utils</h2>

        <button class="btn btn-primary b" id="btn-showVirtual">
            ${t('popup_home_virtual')}
            <img src="../icons/ic-arrow-right.svg" alt="">
        </button>

        <button class="btn btn-primary b" id="btn-showTODO">
            ${t('popup_home_todo')}
            <img src="../icons/ic-arrow-right.svg" alt="">
        </button>

        <button class="btn btn-primary b" id="btn-showOptions">
            ${t('popup_home_options')}
            <img src="../icons/ic-arrow-right.svg" alt="">
        </button>

        <p class="bg-danger" style="margin: 7px; border-radius: 7px; color: black; padding: 5px; font-size: x-small;
            display: none;" id="refresh-pls-home">
            ${t('popup_home_refreshPls')}
        </p>

        <div class="form-check form-switch" style="margin-top: 10px;">
            <input class="form-check-input" type="checkbox" id="hideScoresQuickOption">
            <label class="form-check-label" for="hideScoresQuickOption">
                ${t('popup_home_hideScores')}
            </label>
        </div>
	`, document.getElementById('home')!
);

render(
	html`
		<div style="position: absolute; top: 5px; left: 5px; display: flex; height: 50px">
			<button class="btn btn-default" id="btn-backHome-TODO"
					style="width: auto; padding: 3px; color: white; display: flex;">
				<img src="../icons/ic-arrow-right.svg" alt="" class="back-btn">
				<h3 style="position: relative; top: -4px; left: 5px;">
					${t('popup_virtual_title')}	
				</h3>
			</button>
		</div>

		<br><br>
		
		<details style="width: 100%">
			<summary style="margin: 5px">${t("popup_virtual_category_tasks")}</summary>
			<div class="table-responsive-md" style="background: #181a1b; color: #d1cdc7">
				<table class="table button-flat">
					<thead>
					<tr style="border-bottom: 2px solid rgb(222, 226, 230); 383d3f;">
						<th class="col-md-auto">${t("popup_virtual_table_tr_task")}</th>
						<th class="col-sm-4">${t("popup_virtual_table_tr_actions")}</th>
					</tr>
					</thead>
					<tbody id="virtualTasksTable"></tbody>
				</table>
			</div>
			
			<span class="categ" id="noVirtualTasks">${t("popup_virtual_noVirtualTasks")}</span>
		</details>


        <details style="width: 100%; display: flex; flex-direction: column;">
            <summary style="margin: 5px">${t("popup_virtual_category_optionsOverride")}</summary>
	        
            <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                <div class="form-check form-switch switch-full d-flex align-items-center justify-content-between">
                    <label for="hideScoresOption" class="mb-0 form-check-label">Blokuj inne podstrony</label>
                    <div class="form-check form-switch m-0">
                        <input class="form-check-input" type="checkbox" id="hideScoresOption">
                    </div>
                </div>
            </div>
	        
            <span class="categ">${t("popup_virtual_optionsNotice")}</span>
	        
	        <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                <div class="form-check form-switch switch-full d-flex align-items-center justify-content-between">
                    <label for="hideScoresOption" class="mb-0 form-check-label">${t('popup_options_hideScores')}</label>
                    <div class="form-check form-switch m-0">
                        <input class="form-check-input" type="checkbox" id="hideScoresOption">
                    </div>
                </div>
	        </div>


            <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                <div class="form-check form-switch switch-full d-flex align-items-center justify-content-between">
                    <label for="hideScoresOption" class="mb-0 form-check-label">Blokuj inne podstrony</label>
                    <div class="form-check form-switch m-0">
                        <input class="form-check-input" type="checkbox" id="hideScoresOption">
                    </div>
                </div>
            </div>
        </details>


        <div class="d-flex gap-2" style="width: 100%; display: flex; justify-content: center; align-items: center; margin-top: 5px;">
            <div class="input-group input-group-sm" style="width: 80px;">
                <input type="number" class="form-control" min="0" placeholder="0" id="virtualSetupHours">
                <span class="input-group-text">h</span>
            </div>

            <div class="input-group input-group-sm" style="width: 80px;">
                <input type="number" class="form-control" min="0" max="59" placeholder="0" id="virtualSetupMinutes">
                <span class="input-group-text">m</span>
            </div>
        </div>

		<button type="button" style="margin: 10px;" class="btn btn-outline-success"> START </button>

	`, document.getElementById('virtual')!
);

render(
	html`
        <div style="position: absolute; top: 5px; left: 5px; display: flex; height: 50px">
            <button class="btn btn-default" id="btn-backHomeTODO"
                    style="width: auto; padding: 3px; color: white; display: flex;">
                <img src="../icons/ic-arrow-right.svg" alt="" class="back-btn">
                <h3 style="position: relative; top: -4px; left: 5px;">${t('popup_todo_title')}</h3>
            </button>
        </div>
        
        <br><br>
        
		<div id="todo-table" style="max-height: 281px; overflow-y: auto; width: 100%;"></div>
	`, document.getElementById('todo')!
);

render(
	html`
		<div>
			<div style="position: absolute; top: 5px; left: 5px; display: flex; height: 50px">
				<button class="btn btn-default" id="btn-backHome-options"
						style="width: auto; padding: 3px; color: white; display: flex;">
					<img src="../icons/ic-arrow-right.svg" alt="" class="back-btn">
					<h3 style="position: relative; top: -4px; left: 5px;">${t('popup_options_title')}</h3>
				</button>
			</div>
		</div>

		<br><br>
		
		<span class="categ">
			${t('popup_options_c_func')}
		</span>

		<div class="form-check form-switch switch-full d-flex align-items-center justify-content-between">
			<label for="hideScoresOption" class="mb-0 form-check-label">${t('popup_options_hideScores')}</label>
			<div class="form-check form-switch m-0">
				<input class="form-check-input" type="checkbox" id="hideScoresOption">
			</div>
		</div>

		<div class="form-check form-switch switch-full d-flex align-items-center justify-content-between">
			<label for="hideTimerOption" class="mb-0 form-check-label">${t('popup_options_hideTimers')}</label>
			<div class="form-check form-switch m-0">
				<input class="form-check-input" type="checkbox" id="hideTimerOption">
			</div>
		</div>

		<span class="categ">
			${t('popup_options_c_meta')}
		</span>
		
		
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		
		<div style="display: flex; justify-content: space-between; width: 82%; margin-top: 7px;">
			<label for="lang">
				${t("popup_options_language")}
			</label>
			<select style="height: 25px; font-size: 17px; padding: 2px; width: auto;"
					class="form-control" name="lang" id="lang">
				<option value="pl">pl</option>
				<option value="en">en</option>
			</select>
		</div>

		<span class="categ">
			${t('popup_options_c_data')}
		</span>

		<div style="width: 80%; display: flex; justify-content: space-between;">
			<button id="btn-exportData" type="button" class="btn btn-warning b" style="width: 49%">
				${t('popup_options_export')}
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload" viewBox="0 0 16 16">
					<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
					<path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
				</svg>
			</button>
			<button id="btn-importData" type="button" class="btn btn-warning b" style="width: 49%">
				${t('popup_options_import')}
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
					<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
					<path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
				</svg>
			</button>
		</div>
		<input id="input-importDataFile" type="file" accept="application/json,.json" style="position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0;" />
		<button id="btn-deleteAllData" type="button" class="btn btn-danger b">
			${t('popup_options_removeAllData')}
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3"
				 viewBox="0 0 16 16" style="position: relative; top: -2px;">
				<path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
			</svg>
		</button>

		<div id="popup-data-notice" style="display: none; width: 80%; margin-top: 6px; padding: 6px; border-radius: 6px; font-size: 12px; text-align: center; background: #2b3035;"></div>

		<div id="popup-confirm" style="display: none; width: 88%; margin-top: 6px; padding: 8px; border-radius: 8px; background: #2b3035; border: 1px solid #40464d;">
			<div id="popup-confirm-message" style="font-size: 12px; margin-bottom: 8px;"></div>
			<div style="display: flex; gap: 6px; justify-content: flex-end;">
				<button id="popup-confirm-cancel" type="button" class="btn btn-secondary" style="padding: 4px 8px;">${t('popup_common_cancel')}</button>
				<button id="popup-confirm-accept" type="button" class="btn btn-danger" style="padding: 4px 8px;">${t('popup_common_confirm')}</button>
			</div>
		</div>

		<!--        <div class="form-group">-->
		<!--            <label for="exampleInputFile">Import danych</label>-->
		<!--            <input type="file" id="exampleInputFile" placeholder="Wybierz plik z danymi">-->
		<!--        </div>-->
	`, document.getElementById('options')!
);

document.getElementById('btn-showVirtual')?.addEventListener('click', showVirtual);
document.getElementById('btn-showTODO')?.addEventListener('click', showTODO);
document.getElementById('btn-showOptions')?.addEventListener('click', showOptions);

document.getElementById('btn-backHome-virtual')?.addEventListener('click', backHome);
document.getElementById('btn-backHome-TODO')?.addEventListener('click', backHome);
document.getElementById('btn-backHome-options')?.addEventListener('click', backHome);
}
