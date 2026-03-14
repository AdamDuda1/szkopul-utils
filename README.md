# Szkopuł Utils

Szkopuł Utils is a browser extension that provides various QOL improvements and additional features for the [Szkopuł.edu.pl](https://szkopul.edu.pl/) website.

## Installation

**Install from the extension store:**
- [Chrome Web Store](https://chrome.google.com/webstore/detail/szkopu%C5%82-utils/ljhkjjkmhgbhfjhccgkggmibfbdjpf)
- [Firefox Add-ons](https://addons.mozilla.org/pl/firefox/addon/szkopul-utils/)

**Install locally:**
- Compress the files in the `src` folder into a zip file (manifest.json must be directly in the zip's root). **Make sure to run `npm install` and `npm run build` to compile all the TS scripts before** (you might also need to install `esbuild` and `typescript` if you don't have that already)**!**
- Load to Chrome with developer mode enabled or to Firefox Developer Edition (you may need to disable signed extensions in about:config (or no if mozilla is nice and approves the extension idk)).

## Full list of features:

- Notes for tasks (saved in browser's storage);
- Actually searches when you press enter in the search bar.
- Hides the 'Contact' (or 'Send feedback' in english) button in the bottom left corner of the footer. It previously caused bottom part of the website's elements to be non-interactable (because of bad flex-box styling and `z-index: 999`).

## Contributing

## Notes

I originally wanted to make the 'frontend' part of this extension in Angular, but it was a bit hard to start with it and mix it with the extension file structure. Because of that, I started with just standard TS and a template for the extension files from the internet, and Im using libraries that imitate parts of Angular (I mean, do something similar), like `lit` for inserting reactive HTML. I may make a 2.0 version in the future with full Angular if there is a need for it (and if I have the time).

## TODO:

- Remove the popups and the 'i' when the task is solved (for hideScores)
- **Add comments under tasks ?**
- ts compile formats: iife vs esm
- ~~Bootstrap or Shoelace?~~
- Remove shoelace and switch to bootstrap
- Crop bootstrap so only things that are actually used are included (???)

- Maybe useful in the future: 
```
"run_at": "document_//start"
```