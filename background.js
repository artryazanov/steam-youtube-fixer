var youtubeFixer = {

    STEAM_BASE_URL: '//steamcommunity.com/',

    VIDEO_PATH_LIST: ['/videos/add'],

    /**
     * Get the URL of a tab by its ID.
     *
     * @param {Number} tabId - The Chrome tab ID to read.
     * @param {Function} callback - Function invoked with the URL string of the tab.
     * @returns {void}
     */
    getTabUrl: function(tabId, callback)
    {
        chrome.tabs.get(tabId, function(tab){
            callback && callback(tab.url)
        });
    },

    /**
     * Check whether the given tab is a Steam video page we care about.
     *
     * @param {Number} tabId - The Chrome tab ID to check.
     * @param {Function} callback - Invoked only when the tab URL matches a target video page.
     * @returns {void}
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
     * Register a listener that injects scripts on relevant Steam pages.
     *
     * @returns {void}
     */
    setTabUpdateListener: function()
    {
        var fixer = this;
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
            fixer.isVideoTab(tabId, function() {
                if (changeInfo.status === 'complete') {
                    try {
                        chrome.scripting.executeScript(
                            { target: { tabId: tabId }, files: ['jquery-3.5.1.min.js'] },
                            function() {
                                chrome.scripting.executeScript({ target: { tabId: tabId }, files: ['youtubeFixerInjection.js'] });
                            }
                        );
                    } catch (e) {
                        console.error('Injection failed', e);
                    }
                }
            });
        });
    },

    /**
     * Initialize the background script.
     *
     * @returns {void}
     */
    init: function()
    {
        this.setTabUpdateListener();
    },

};

youtubeFixer.init();