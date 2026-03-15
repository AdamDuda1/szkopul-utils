
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
		
        [id*="report"] > article:first-of-type, .container-fluid.body .row > div:first-of-type {
            display: none !important;                       /* TODO: ^ not safe probably*/
		}
		
		#submission-status-table tbody tr td:last-of-type, #open-form,
			#tag-form, .modal-backdrop.fade.show {
			display: none !important;
		}
		
		
		
    `; // TODO find a better way of hiding the actual score text

	const styleElement: HTMLStyleElement = document.createElement('style');
	styleElement.textContent = css;

	document.documentElement.appendChild(styleElement);
}