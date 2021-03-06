### v0.7.0

* enhancement: Words can now be added on Firefox for Android, which didn't have the desktop context menu. A pop up shows up after selecting a word.
* enhancement: All major extension features can now be enabled/disabled in the settings.
* bugfix: important bug that prevented the capturing of surrounding sentences
* developers: added needed untracked files to git, misc architecture improvements

---- some changelogs were not recorded here, check the Firefox extension change for more info ----

### v0.4.3
* resolved bug of pervious alternative translations staying displayed over different words or after changing language
* disables illegal word example source URL links generated by the plugins' sketchy interaction with Vocabulary.com sources. It will be reverted to more proper source page URL's in the words' description in a following version.

### v0.4.0
* modularisation of the vocabulary.com api into a new project (https://github.com/th0rgall/voc-api/). It is now reusable for other Node/browser projects.
* new build system with a makefile

### v0.3.6
* language switcher only shows when clicking the current language
* more detailed translations and alternatives. Hover for synonyms.

### v0.3.5
* language switcher
* links in wordlists to external resources like DuckDuckGo Image Search, Google Image Search, GIPHY and YouGlish

### v0.3.4
* fixed translations after voc api refactor, translation not sent to background anymore

### v0.3.3
* auto-corrects words that are added to the form used in Vocabulary.com
* fixed notification icon
