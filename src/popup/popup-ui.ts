import { html, render } from 'lit';
import { t } from '../globals';

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
                    style="width: auto; padding: 3px; color: white;     display: flex;">
                <img src="../icons/ic-arrow-right.svg" alt="" class="back-btn">
                <h3 style="position: relative; top: -4px; left: 5px;">Do zrobienia</h3>
            </button>
        </div>
        
        <br><br>
        
        <div id="todo-table"></div>

        <button type="button" class="btn btn-info">Otwórz pełną listę</button>
	`, document.getElementById('todo')!
);

render(
	html`
        <div>
            <div style="position: absolute; top: 5px; left: 5px; display: flex; height: 50px">
                <button class="btn btn-default" id="btn-backHome-options"
                        style="width: auto; padding: 3px; color: white; display: flex;">
                    <img src="../icons/ic-arrow-right.svg" alt="" class="back-btn">
                    <h3 style="position: relative; top: -4px; left: 5px;">Opcje</h3>
                </button>
            </div>
        </div>

        <br><br>

        <div class="form-check form-switch switch-full d-flex align-items-center justify-content-between">
            <label for="hideScoresOption" class="mb-0 form-check-label">Ukrywaj wyniki</label>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" id="hideScoresOption">
            </div>
        </div>
        
        <div class="form-check form-switch switch-full d-flex align-items-center justify-content-between">
            <label for="hideTimerOption" class="mb-0 form-check-label">Ukrywaj czasomierze</label>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" id="hideTimerOption">
            </div>
        </div>


        <div style="display: flex; justify-content: space-around;">
            <label for="lang">${t("popup_options_language")}</label>
            <select class="form-control" name="lang" id="lang">
                <option value="pl">pl</option>
                <option value="en">en</option>
            </select>
        </div>
        

        <button type="button" class="btn btn-warning b">Export danych</button>
        <button type="button" class="btn btn-danger b">Usuń wszystkie dane</button>

        <!--        <div class="form-group">-->
        <!--            <label for="exampleInputFile">Import danych</label>-->
        <!--            <input type="file" id="exampleInputFile" placeholder="Wybierz plik z danymi">-->
        <!--        </div>-->
	`, document.getElementById('options')!
);
