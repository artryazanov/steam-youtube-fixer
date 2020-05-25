var youtubeFixer = {

    STEAM_BASE_URL: '//steamcommunity.com/',

    VIDEO_PATH_LIST: ['/videos/add'],

    /**
     * @param {Number} tabId
     * @param {Function} callback
     */
    getTabUrl: function(tabId, callback)
    {
        chrome.tabs.get(tabId, function(tab){
            callback && callback(tab.url)
        });
    },

    /**
     * @param {Number} tabId
     * @param {Function} callback
     */
    isVideoTab: function(tabId, callback)
    {
        var fixer = this;
        this.getTabUrl(tabId, function(tabUrl) {

            var isVideoTab = false;
            var baseUrl = fixer.STEAM_BASE_URL;

            for (var i = 0; i < fixer.VIDEO_PATH_LIST.length; i++) {
                var path = fixer.VIDEO_PATH_LIST[i];
                isVideoTab = isVideoTab || ((tabUrl.indexOf(baseUrl) > 0) && (tabUrl.indexOf(path) > 0))
            }

            isVideoTab && callback && callback();
        });
    },

    /**
     *
     */
    setTabUpdateListener: function()
    {
        var fixer = this;
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {

            fixer.isVideoTab(tabId, function() {

                if (changeInfo.status == 'complete') {
                    chrome.tabs.executeScript(tabId, {file: 'jquery-3.5.1.min.js'});
                    chrome.tabs.executeScript(tabId, {file: 'youtubeFixerInjection.js'});
                }
            });
        });
    },

    /**
     *
     */
    init: function()
    {
        this.setTabUpdateListener();
    },

};

youtubeFixer.init();