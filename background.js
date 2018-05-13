chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'vocadder') {
    port.onMessage.addListener(({type: type, selection: selection}) => {
      if (type === 'checkLogin') {
        checkLogin();
      } else if (type === 'selection') {
        checkSelection(selection);
      }
    });
  }
});

loggedIn = false;
checkLogin();

// log-in check
function checkLogin() {
  if (!loggedIn) {
    requestUrl = 'https://www.vocabulary.com/account/progress';
    var req = new XMLHttpRequest();
    req.open("GET", requestUrl, true);
    //req.withCredentials = true;
    req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    req.responseType = "json";
    req.onload = function () {
      if (req.responseURL !== requestUrl) { // response url was not same as requested url: 302 login redirect happened
        // create a context menu to redirect to a login page
        chrome.contextMenus.create({id: "login", title: "Log in to voc.com to save words", onclick: () => {
          chrome.tabs.create({url: 'https://www.vocabulary.com/login'});
        }});
      } else {
        loggedIn = true;
        chrome.contextMenus.remove("login");
        createContextMenus();
      }
    }
    req.send();
  }
}

const addToText = "voc.com: add '%s' to...";

// create "add to" context menus
function createContextMenus() {
  const refererUrl = `https://www.vocabulary.com/dictionary/hacker`; 
  const requestUrl = "https://www.vocabulary.com/lists/byprofile.json";

  // options: name, createdate, wordcount, activitydate TODO: make options
  let sortBy = "modifieddate"

  withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
    var req = new XMLHttpRequest();
    req.open("GET", requestUrl, true);
    req.withCredentials = true;
    req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    req.responseType = "json";
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
        chrome.contextMenus.create({id: "addtoParent", title: addToText, contexts: ["selection"]});
        // create "start learning" context menu
        chrome.contextMenus.create({id: "learnvoc", parentId: "addtoParent", title:"Just Start Learning", contexts: ["selection"], 
        onclick: startLearning});
        // separator
        chrome.contextMenus.create({id: "sep", parentId: "addtoParent", type: "separator", contexts: ["selection"]});
        // add list entries
        req.response.result.wordlists
          .filter(wl => wl.owner)
          .sort((a,b) => a[sortBy] > b[sortBy] ? -1 : 1) // high to low
          .forEach((wordList) => {
          chrome.contextMenus.create({id: `addto-${wordList.name}`, 
          title: `${wordList.name} (${wordList.wordcount})`, parentId: "addtoParent", contexts: ["selection"], onclick: addTo(wordList.wordlistid)})
        });
        detachHook();
      }
      else if (req.status != 200) {
        console.log(`Error: ` + req.responseText);
      }
    }
    req.send();
  }); 
}

function getWords(selection) {
  return selection.trim().split(/\s/);
}

// update context menu entry when selection contains more words
function checkSelection(selection) {
  const words = getWords(selection);
  if (words.length > 1) {
    chrome.contextMenus.update('addtoParent', {title: `voc.com: add ${words.length} words to...`});
  } else {
    // reset
    chrome.contextMenus.update('addtoParent', {title: addToText});
  }
}


/**
 * Execute an function with a modified Referer header for browser requests
 * @param {*} refererUrl the referer URL that will be injected
 * @param {*} requestUrl the request URL's for which the header has to be injected
 * @param {*} action the action (request) to be executed. 
 *                  Gets passed a function that will detach the header modifier hook if called
 */
function withModifiedReferrer(refererUrl, requestUrl, action) {
  function refererListener(details) {
    const i = details.requestHeaders.findIndex(e => e.name.toLowerCase() == "referer");
    if (i != -1) {
      details.requestHeaders[i].value = refererUrl;
    } else {
      details.requestHeaders.push({name: "Referer", value: refererUrl});
    }
    // Firefox uses promises
    // return Promise.resolve(details);
    // Chrome doesn't. Todo: https://github.com/mozilla/webextension-polyfill

    // important: do create a new object, passing the modified argument does not work
    return {requestHeaders: details.requestHeaders};
  }

  // modify headers with webRequest hook
  chrome.webRequest.onBeforeSendHeaders.addListener(
    refererListener, //  function
    {urls: [requestUrl]}, // RequestFilter object
    ["requestHeaders", "blocking"] //  extraInfoSpec
  );

  action(() => {
    // detach hook
    if (chrome.webRequest.onBeforeSendHeaders.hasListener(refererListener)) {
      chrome.webRequest.onBeforeSendHeaders.removeListener(refererListener)
    }
  });
}

// detects multiple words in the selection text
// and call the given function on it 
function addAll(selectionText, addFunction) {
    const words = getWords(selectionText);
    if (words.length > 1) {
        words.forEach(addFunction); 
    } else if (words.length === 1) {
        addFunction(words); 
    } else {
        console.warn('voc-adder: no text selected');
    }
}


// returns an onlick function for the Add To... context menu
function addTo(wordListId) {
  return (info, tab) => {
    addAll(info.selectionText.toLowerCase(), addToList.bind(null, wordListId));
  }
}

// the onclick function for start learning
function startLearning(info, tab) {
    addAll(info.selectionText.toLowerCase(), startLearningWord);
}

function startLearningWord(wordToLearn) {
    console.log("Trying to learn " + wordToLearn)
    let refererUrl = `https://www.vocabulary.com/dictionary/${wordToLearn}`; 
    let requestUrl = "https://www.vocabulary.com/progress/startlearning.json";

    withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
      var req = new XMLHttpRequest();
      req.open("POST", requestUrl, true);
      req.withCredentials = true;
      req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
      req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            console.log(req.responseText);
            detachHook();
        }
        else if (req.status != 200) {
          console.log(`Error: ` + req.responseText);
        }
      }
      req.send(`word=${wordToLearn}`);
    });
}

function addToList(listId, wordToSave) {
  console.log("Trying to save " + wordToSave)
  const refererUrl = `https://www.vocabulary.com/dictionary/${wordToSave}`; 
  const requestUrl = "https://www.vocabulary.com/lists/save.json";

  withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
    var req = new XMLHttpRequest();
    req.open("POST", requestUrl, true);
    req.withCredentials = true;
    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    let saveObj = {
      "word": wordToSave,
      "lang": "en"
    }
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
          console.log(req.responseText);
          // send notification
          const notificationId = `add-${wordToSave}-to-${listId}`;
          createNotification(notificationId,
            `'${wordToSave}' added successfully`,
            `'${wordToSave}' was added to ${listId}.\nClick to open in voc.com.`,
            () => {
              chrome.tabs.create({url: `https://www.vocabulary.com/dictionary/${wordToSave}`});
            });
          detachHook();
      }
      else if (req.status != 200) {
        console.log(`Error: ` + req.responseText);
      }
     }
    const toSend = `addwords=${encodeURIComponent(JSON.stringify([saveObj]))}&id=${listId}`;
    req.send(toSend);
  });
}

// create a notification with the given title, message and onClick function
function createNotification(notificationId, title, message, onClick) {
  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "voc_favicon.png",
    title: title,
    message: message
  });
  addNotificationClickListener(notificationId, onClick);
}

// adds a listener that will execute the given action when the notification is clicked
// makes sure the listener is removed when the notification is closed
function addNotificationClickListener(notificationId, action) {
  const clickListener = (clickedId) => {
    if (clickedId === notificationId) {
      action();
    }
  };
  // TODO: is onClose also triggered after a click?
  const closeListener = (closedId) => {
    if (closedId === notificationId) {
      // remove click listener
      chrome.notications.onClicked.removeListener(clickListener);
      // remove itself (closeListener)
      chrome.notifications.onClosed.removeListener(closeListener);
    }
  }
  chrome.notifications.onClicked.addListener(clickListener);
  chrome.notifications.onClosed.addListener(closeListener);
}