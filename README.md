# Szkopuł Utils

Szkopuł Utils is a browser extension that provides various QOL improvements and additional features for the [Szkopuł.edu.pl](https://szkopul.edu.pl/) website.

## Installation

**Install from the extension store:**
- [Chrome Web Store](https://chromewebstore.google.com/detail/szkopu%C5%82-utils/obbgoakgbnjcfojfajlmndhlpnlafbfl)
- [Firefox Add-ons](https://addons.mozilla.org/pl/firefox/addon/szkopul-utils/)

**Load locally:**
- Compress the files in the `src` folder into a zip file (manifest.json must be directly in the zip's root). **Make sure to run `npm install` and `npm run build` to compile all the TS scripts before** (you might also need to install `esbuild` and `typescript` if you don't have that already)**!**
- Load to Chrome with developer mode enabled or to Firefox Developer Edition (you may need to disable signed extensions in about:config (or no if mozilla is nice and approves the extension idk)).

## Full list of features:

- Virtual contests (create and participate in a local virtual contest with set tasks, score hiding and calculating options and time)
- Task TODO list
- Inline task statements view and on-the-same-page statement view
- Preferred language and auto-submit
- Score hiding (shows only initial testing reports);
- Notes for tasks (saved in browser's storage);
- Actually searches when you press enter in the search bar;
- Hides the 'Contact' (or 'Send feedback' in english) button in the bottom left corner of the footer. It previously caused bottom part of the website's elements to be non-interactable (because of bad flex-box styling and `z-index: 999`).

<img width="1003" height="111" alt="image" src="https://github.com/user-attachments/assets/01f03ce2-b69a-4a44-9ca3-e49ce9c91931" />


## Notes

I originally wanted to make the 'frontend' part of this extension in Angular, but it was a bit hard to start with it and mix it with the extension file structure. Because of that, I started with just standard TS and a template for the extension files from the internet, and Im using libraries that imitate parts of Angular (I mean, do something similar), like `lit` for inserting reactive HTML **duh, the TS files dont even have classes...** (<-- I might have to change that in the very near future). I may make a 2.0 version in the future with full Angular if there is a need for it (and if I have the time).

## TODO:

- ADD TASKS OUTSIDE OF SZKOPUL TO THE TODO LIST!!!!!!!!!!!

- dashboard doesnt display on mobile

- ! emitTaskSolved('twoj-problem-id'); przy submit albo lepiej przy maxie za zadanie
- menu w problem view
- preferred language is on home page...

- 'stats' page with for example total chars in submissions

- Things in the contest archive!

- (??) hide the midified tables (like problems in contest) untill thir html is not modified (display: none on init and then flex when loaded)
- make the user be able to choose what is displayed on the home page of the popup (szkopul stats/quick score hiding setting)
- **build the menu html on click so it loads faster and is up to date**
- inline task statements in contest views
- Add the same menu in the problem set to the top of the problem page
- Remove the popups and the 'i' when the task is solved (for hideScores) -> 
- **Add comments under tasks ?**

// małę todo:

- zrobić todo i wirtualkę jako array w storage
- wczyteć te dwie arrayki przy renderowaniu rzeczy i wyświetlać odpowiednie przyciski
