import { html, render } from 'lit';

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