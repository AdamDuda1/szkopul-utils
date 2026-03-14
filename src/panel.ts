

document.getElementById('btn-showTODO')?.addEventListener('click', showTODO);
document.getElementById('btn-backHome')?.addEventListener('click', backHome);

export function showTODO() {
	document.getElementById('home')!.style.display = 'none';
	document.getElementById('todo')!.style.display = 'flex';
}

export function backHome() {
	document.getElementById('home')!.style.display = 'flex';
	document.getElementById('todo')!.style.display = 'none';
}


// const view = (count:number) => html`
//   <button @click=${() => update(count+1)}>
//     Clicked ${count} times
//   </button>
// `;
//
// function update(count:number){
// 	render(view(count), document.body);
// 	console.log('update');
// }
//
// update(0);
console.log('init?');
