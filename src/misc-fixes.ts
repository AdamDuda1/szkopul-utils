import { html, render } from 'lit';
import CalHeatmap from "cal-heatmap";

export function makeEnterSearchThings() {
	if (!(window.location.href.includes('/problemset') || window.location.href.includes('/contest'))) return;
	const input = document.querySelector("input[type='search']"); // TODO fix doesnt work on /contest on chrome for some reason

	input?.addEventListener("keydown", function(e) {
		// @ts-ignore
		if (e.key === "Enter") {
			console.log('safjhasdsdfajhldsfa');
			e.preventDefault(); // optional
			// @ts-ignore
			input.parentElement.parentElement!.submit();
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

	const styleElement: HTMLStyleElement = document.createElement('style');
	styleElement.textContent = css;

	document.documentElement.appendChild(styleElement);
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

export function appendHomePageStats() {
	if (!(window.location.href.endsWith('.pl') || window.location.href.endsWith('.pl/'))) return;

	const calHeatmapCss = document.createElement('link');
	calHeatmapCss.rel = 'stylesheet';
	calHeatmapCss.href = 'https://unpkg.com/cal-heatmap/dist/cal-heatmap.css';

	const d3Script = document.createElement('script');
	d3Script.src = 'https://d3js.org/d3.v7.min.js';
	d3Script.type = 'module';
	const calHeatmapScript = document.createElement('script');
	calHeatmapScript.src = 'https://unpkg.com/cal-heatmap/dist/cal-heatmap.min.js';

	// document.head.append(d3Script, calHeatmapScript, calHeatmapCss);

	const host = document.querySelector('.szkopul-dashboard__container,body > div > p') as HTMLElement;

		console.log(host);

	render(html`
        <div id="calendar"></div>
	`, host);

	const cal = new CalHeatmap();

	cal.paint({
		itemSelector: "#calendar",
		range: 12,
		domain: { type: "month" },
		subDomain: { type: "day" },
		data: {
			"2026-03-12": 3,
			"2026-03-13": 6
		}
	});
}