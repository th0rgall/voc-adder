
/**
 * Creates a translation DOM element.
 * @param word word to be translated
 */
function createTranslation(word, color) {

    let defaultLan = 'nl';
    let currentLan = 'nl';
    let persistedLan = localStorage.getItem("defaultTargetLan");
    if (persistedLan) {
        defaultLan = persistedLan;
        currentLan = persistedLan;
    } 

    // create translation element
    const translationEl = document.createElement('div');
    translationEl.classList.add('ve-translation-container')

    const selectEl = document.createElement('select');
    selectEl.setAttribute('name', 'language-switcher');
    selectEl.classList.add('ve-translation-selector');
    translationEl.appendChild(selectEl);

    const langLable = document.createElement('span');
    selectEl.classList.add('ve-translation-label');
    langLable.appendChild(document.createTextNode(''));
    
    const textContainer = document.createElement('p');
    textContainer.classList.add('ve-translation');
    translationEl.appendChild(textContainer);
    const translationText = document.createTextNode('');
    textContainer.appendChild(langLable);
    textContainer.appendChild(translationText);


    const injectTranslation = (target) => {
        // insert translation

        // get shown PoS
        let domPos = document.querySelector('.challenge-slide:last-child');
        let pos;
        // Jan 17, 19:TODO: fix pos by using api, progress no longer in page
        if (domPos && domPos.dataset.progress) pos = JSON.parse(domPos.dataset.progress)[0].pos;

        translate(word, {from: 'en', to: target, pos: pos}).then(res => {

            const tDispFun = (t) => {
                if (t.pos) {
                    return `${t.translation} (${t.pos})`;
                } else return t.translation;
            }
            const tAlts = (t) => { if (t.alternatives) return `Alternatives:\n${t.alternatives.join('\n')}`};


            // primary translation
            translationText.nodeValue = tDispFun(res.translations[0]);
            textContainer.title = tAlts(res.translations[0]);
            // adjust label
            langLable.childNodes[0].nodeValue = `${target.toUpperCase()}: `;
           
            // remove previous alt translations
            let prevAlts = document.querySelector('.challenge-slide:last-child .ve-translation-alternatives');
            if (prevAlts) {
                prevAlts.remove();
            }

            // add additional translations
            if (res.translations.length > 1) {
                const alts = document.createElement('span');
                alts.classList.add('ve-translation-alternatives');
                if (color && color === 'dark') {
                    alts.classList.add('ve-translation-alternatives-dark');
                }

                let altTrans = res.translations.slice(1)
                .map((trans, i, a) => {
                    if (trans) {
                        const span = document.createElement('span');
                        let spanText = tDispFun(trans);
                        if (i !== (a.length - 1))  spanText += ', ';
                        span.appendChild(document.createTextNode(spanText));
                        span.title = tAlts(trans); 
                        return span;
                    } else {
                        return undefined;
                    }
                }).forEach(span => {if (span) return alts.appendChild(span)});
                textContainer.appendChild(alts);
            }
        }).catch(err => {
            console.error(err);
        });
    }

    // insert options
    Object.keys(langs).forEach(code => {
        const optionEl = document.createElement('option');
        optionEl.setAttribute('value', code);
        const optionText = document.createTextNode(langs[code]);
        if (code === defaultLan) {
            optionEl.setAttribute('selected', '');
        }
        optionEl.appendChild(optionText);
        selectEl.appendChild(optionEl);
    });

    selectEl.addEventListener('change', (e) => {
        const selectedLan = e.target.value;
        if (selectedLan !== currentLan) {
            currentLan = selectedLan;
            localStorage.setItem("defaultTargetLan", currentLan);
            injectTranslation(e.target.value);

        }
        // hide the element & show label
        selectEl.style.display = 'none';
        langLable.style.display = 'inline';
    });

    langLable.addEventListener('click', (e) => {
        selectEl.style.display = 'inline';
        langLable.style.display = 'none';
    })

    injectTranslation(defaultLan);

    return translationEl;
}

const makeLinkGetter = (f) => ((w) => f(encodeURIComponent(w)));

const externalLinks = [
    {
        "title": 'DuckDuckGo Image Search',
        "icon": 'icons/ddg-favicon.ico',
        "getLink": makeLinkGetter((w) => `https://duckduckgo.com/?q=${w}&t=ffab&iax=images&ia=images`)
    }, {
        "title": 'Google Image Search',
        "icon": 'icons/google-favicon.ico',
        "getLink": makeLinkGetter((w) => `https://www.google.com/search?tbm=isch&q=${w}&tbs=imgo:1`)
    }, {
        "title": 'GIPHY Image Search',
        "icon": 'icons/giphy-favicon.png',
        "getLink": makeLinkGetter((w) => `https://giphy.com/search/${w}`)
    }, {
        "title": 'YouGlish Pronounciation Search',
        "icon": 'icons/youglish-favicon.png',
        "getLink": makeLinkGetter((w) => `https://youglish.com/search/${w}`)
    }, {
        "title": 'Urban Dictionary Search',
        "icon": 'icons/urbandictionary-favicon.ico',
        "getLink": makeLinkGetter((w) => `https://www.urbandictionary.com/define.php?term=${w}`)
    }, {
        "title": 'Dictionary.com Search',
        "icon": 'icons/dictionary-com.png',
        "getLink": makeLinkGetter((w) => `https://www.dictionary.com/browse/${w}`)
    }, {
        "title": 'Thesaurus.com Search',
        "icon": 'icons/thesaurus-com.png',
        "getLink": makeLinkGetter((w) => `https://www.thesaurus.com/browse/${w}`)
    }, {
        "title": 'Wiktionary',
        "icon": 'icons/wiktionary.ico',
        "getLink": makeLinkGetter((w) => `https://en.wiktionary.org/wiki/${w}`)
    }, {
        "title": 'Wikipedia',
        "icon": 'icons/wikipedia.ico',
        "getLink": makeLinkGetter((w) => `https://en.wikipedia.org/wiki/${w}`)
    }, {
        "title": 'Wordnik',
        "icon": 'icons/wordnik.png',
        "getLink": makeLinkGetter((w) => `https://www.wordnik.com/words/${w}`)
    }, {
        "title": 'Merriam-Webster',
        "icon": 'icons/merriam-webster.png',
        "getLink": makeLinkGetter((w) => `https://www.merriam-webster.com/dictionary/${w}`)
    }, {
        "title": 'Google Define',
        "icon": 'icons/google-define.png',
        "getLink": makeLinkGetter((w) => `https://www.google.com/search?hl=en&q=google%20define#dobs=${w}`)
    }, {
        "title": 'The Free Dictionary',
        "icon": 'icons/thefreedictionary.png',
        "getLink": makeLinkGetter((w) => `https://www.thefreedictionary.com/${w}`)
    }
];

function createLinks(word) {
    const container = document.createElement('span');
    container.classList.add('ve-links');
    externalLinks.forEach(link => {
        const ref = document.createElement('a');
        ref.href = link.getLink(word);
        ref.target = '_blank';
        ref.rel = 'noopener noreferrer';
        ref.classList.add('ve-external-link');
        ref.setAttribute("title", link.title);
        container.appendChild(ref);

        const icon = document.createElement('img');
        icon.src = chrome.runtime.getURL(link.icon);
        ref.appendChild(icon);

    });
    return container;
}