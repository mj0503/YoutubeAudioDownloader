// Regex-pattern to check URLs against. 
// It matches URLs like: http[s]://[...]stackoverflow.com[...]
var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?stackoverflow\.com/;

var queue = "";

// A function to use as callback
function doStuffWithDom(domContent) {
    console.log('I received the following DOM content:\n' + domContent);
}

// When the browser-action button is clicked...
chrome.browserAction.onClicked.addListener(function (tab) {
    // ...check the URL of the active tab against our pattern and...
    if (urlRegex.test(tab.url)) {
        // ...if it matches, send a message specifying a callback too
        chrome.tabs.sendMessage(tab.id, {text: 'report_back'}, doStuffWithDom);
    }
});


chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.command) {
        case 'setItem':
            localStorage[request.name] = JSON.stringify(request.data);
            sendResponse(localStorage[request.name]);
            return;
        case 'getItem':
            var retValue;
            if (typeof(localStorage[request.name]) === 'string') {
                retValue = JSON.parse(localStorage[request.name]);
            }
            sendResponse(retValue);
            return;
        case 'deleteItem':
            if (typeof localStorage[request.name] !== 'undefined') {
                delete localStorage[request.name];
            }
            return;
        case 'download':
            chrome.downloads.download({ url: request.url });
            return;
    }
});
