const manifestVersion = chrome.runtime.getManifest().version;
console.log(`Thank you for using Szkopuł Utils (v${manifestVersion}), Dzięki! :)`);


fix_contact_button();


function fix_contact_button() {
	const css: string = `
        #szkopul-contact-form-open-div {
            position: absolute !important;
            left: 7px !important;
            bottom: 10px !important;
            width: auto !important;
        }
    `;

	const styleElement: HTMLStyleElement = document.createElement('style');
    styleElement.textContent = css;

    document.documentElement.appendChild(styleElement);
}