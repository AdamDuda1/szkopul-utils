// Use a local copy of Shoelace's `dist` directory so the extension can load scripts
// from the extension bundle (avoids CDN and Content Security Policy issues).
import { setBasePath } from './shoelace/dist/utilities/base-path.js';

setBasePath('./shoelace/dist/');

import './shoelace/dist/components/button/button.js';
import './shoelace/dist/components/switch/switch.js';
import './shoelace/dist/components/input/input.js';

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
