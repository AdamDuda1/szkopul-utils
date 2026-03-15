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