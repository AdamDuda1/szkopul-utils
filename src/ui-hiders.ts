
export function hideScores() {
	console.log('HIDE!!!')

	const bg = localStorage.getItem("dark-mode") === "enabled" ? '#181a1b' : 'white';
	const fg = localStorage.getItem("dark-mode") === "enabled" ? '#d1cdc7' : 'black';

	const css: string = `
        .result__margin {
            background-image: linear-gradient(to right, ${bg}, #8e009d 50%, ${bg}) !important;
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
		
        [id*="report"] > article:first-of-type {
            display: none !important;
		}
    `; // TODO find a better way of hiding the actual score text

	const styleElement: HTMLStyleElement = document.createElement('style');
	styleElement.textContent = css;

	document.documentElement.appendChild(styleElement);
}