

document.getElementById('btn-showTODO')?.addEventListener('click', showTODO);
document.getElementById('btn-showOptions')?.addEventListener('click', showOptions);
document.getElementById('btn-backHome-options')?.addEventListener('click', backHome);

export function backHome() {
	document.getElementById('home')!.style.display = 'flex';
	document.getElementById('todo')!.style.display = 'none';
	document.getElementById('options')!.style.display = 'none';
}

export function showTODO() {
	document.getElementById('home')!.style.display = 'none';
	document.getElementById('todo')!.style.display = 'flex';
	document.getElementById('options')!.style.display = 'none';
}

export function showOptions() {
	document.getElementById('options')!.style.display = 'flex';
	document.getElementById('home')!.style.display = 'none';
	document.getElementById('todo')!.style.display = 'none';
}

console.log('init?');
