import {t} from "./globals";

function attachCSS(css: string) {
	const styleElement: HTMLStyleElement = document.createElement('style');
	styleElement.textContent = css;

	document.documentElement.appendChild(styleElement);
}

export function hideScores() {
	console.log('HIDE!!!')

	const bg = localStorage.getItem("dark-mode") === "enabled" ? '#181a1b' : 'white';
	const fg = localStorage.getItem("dark-mode") === "enabled" ? '#d1cdc7' : 'black';

	const css: string = `
        .result__margin {
            background-image: linear-gradient(to right, ${bg}, #ce61d4 50%, ${bg}) !important;
            font-size: 0 !important;
        }
        .result__margin::after {
            content: '???' !important;
            font-size: 1rem !important;
            color: ${fg} !important;
        }
        [id*="score"] {
            font-size: 0 !important;
            color: transparent !important;
		}
        [id*="score"]::after {
            content: '???' !important;
            font-size: 1rem !important;
            color: ${fg} !important;
		}
		
        [id*="report"] > article:first-of-type, .container-fluid.body .row > div:first-of-type > article {
            display: none !important;                       /* TODO: ^ not safe probably*/ /*IT INDEED WAS NOT SAFE*/
		}
		
		#submission-status-table tbody tr td:last-of-type, #open-form,
			#tag-form, .modal-backdrop.fade.show {
			display: none !important;
		}
    `;

	attachCSS(css);
}

export function hideInitReportBadges() {
	const css: string = `
        section .table-responsive-md tr td a span.badge {
        	display: none !important;
        }
    `;

	attachCSS(css);
}

export function hidePageContents() {
	const color = localStorage.getItem("dark-mode") === "enabled" ? '#d1cdc7' : '#212529';

	const css: string = `
		.body {
			height: 80vh !important;
			display: flex !important;
			flex-direction: column !important;
			justify-content: center !important;
		}
		
		.body > *:not(.pageHiddenMessage) {
			display: none !important;
		}

		.body .pageHiddenMessage {
			display: block !important;
			margin-bottom: 10px;
			color: ${color};
			text-align: center;
			font-size: 20px;
		}
    `;

	attachCSS(css);

	const tryToAttach = () => {
		const bodyEl = document.querySelector('.body');
		if (bodyEl) {
			const createMsg = (text: string) => {
				const el = document.createElement('div');
				el.classList.add('pageHiddenMessage');
				el.textContent = text;
				bodyEl.appendChild(el);
			};
			createMsg(t("pageBlockedMessage1"));
			createMsg(t("pageBlockedMessage2"));
			return true;
		}
		return false;
	};

	if (!tryToAttach()) {
		const observer = new MutationObserver((_, obs) => {
			if (tryToAttach()) obs.disconnect();
		});
		observer.observe(document.documentElement, { childList: true, subtree: true });
	}
}

export function hideRulesTab() {
	const css: string = `
		.list-group.list-group-flush.border-top a[href*="/rules/"] {
		  display: none;
		}
    `;

	attachCSS(css);
}