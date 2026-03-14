
export function hideScores() {
	console.log('HIDE!!!')
	document.querySelectorAll('.result--TRIED.result__margin').forEach(el => {
		(el as HTMLElement).style.backgroundImage = 'linear-gradient(to right, #181a1b, #8e009d 50%, #181a1b) !important';
		(el as HTMLElement).style.display = 'none';
	});
}