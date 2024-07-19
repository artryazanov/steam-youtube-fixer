if (typeof youtubeFixer == 'undefined') {

    let youtubeFixer = {

        isInjected: false,

        videoList: {},

        lastVideoList: {},

        getVideoPage: function(pageNum, callback)
        {
            let p = !!pageNum ? pageNum : 1;
            $.get('/my/videos/?p=' + p, function(data) {
                !!callback && callback(data);
            });
        },

        getVideoMaxPage: function(callback) {
            this.getVideoPage(null, function (data) {
                let $page = $($.parseHTML(data));
                let videoMaxPage = $page.find('a.pagingPageLink').last().text();
                !!callback && callback(videoMaxPage);
            });
        },

        initVideoList: function()
        {
            this.videoList = JSON.parse(window.localStorage.getItem(youtubeFixer.getStorageKey()));
            if (this.videoList === null) {
                this.videoList = {};
            }
        },

        fixImportedVideoVisibility: function() {
            let $itemList = $('#add_vid_list .add_vid_list_entry');
            let $inputList = $('#add_vid_list .add_vid_list_entry input.vid_cb');
            for (let i = 0; i < $itemList.length; i++) {
                let $img = $($inputList[i]);
                let youtubeId = $img.attr('value');
                if (typeof youtubeFixer.videoList[youtubeId] != 'undefined') {
                    let $item = $itemList[i];
                    $item.remove();
                }
            }
            console.log('Wrong videos removed!');
        },

        matchYoutubeId: function(text)
        {
            let matches = text.match(/\/vi\/([a-zA-Z0-9_\-]+)\/mqdefault/);
            return matches[1];
        },

        scanUploadVideosRecursive: function(pageNum, videoList, maxPage, callback)
        {
            if (pageNum > 0) {
                console.log('Page #' + pageNum);
                this.getVideoPage(pageNum, function(data) {
                    let $page = $($.parseHTML(data));
                    let $itemList = $page.find('.video_item a.profile_media_item');
                    for (let i = 0; i < $itemList.length; i++) {
                        let $item = $itemList[i];
                        let matches = $item.href.match(/\?id=(\d+)/);
                        let steamId = matches[1];
                        let $img = $page.find('#imgWallItem_' + steamId + ' img');
                        let youtubeId = youtubeFixer.matchYoutubeId($img.attr('src'));
                        if (typeof videoList[youtubeId] == 'undefined') {
                            videoList[youtubeId] = steamId;
                        } else {
                            console.log('Duplication: ' + $item.href);
                        }
                    }
                    let maxPage = $page.find('a.pagingPageLink').last().text();
                    youtubeFixer.scanUploadVideosRecursive(--pageNum, videoList, maxPage, callback);
                })
            } else {
                !!callback && callback(videoList, maxPage);
            }
        },

        scanUploadVideos: function(maxPage, callback)
        {
            youtubeFixer.scanUploadVideosRecursive(maxPage, {}, null, callback);
        },

        isHaveOldVideos: function(videoList)
        {
            let isHaveOld = false;
            for(let youtubeId in videoList) {
                if (typeof youtubeFixer.videoList[youtubeId] != 'undefined') {
                    isHaveOld = true;
                }
            }
            return isHaveOld;
        },

        finishUpdateVideos: function(videoList) {
            for(let youtubeId in videoList) {
                youtubeFixer.videoList[youtubeId] = videoList[youtubeId];
            }
            window.localStorage.setItem(youtubeFixer.getStorageKey(), JSON.stringify(youtubeFixer.videoList));
            console.log('Video scan finished!');
            youtubeFixer.fixImportedVideoVisibility();
        },

        getStorageKey: function() {
            let key = 'youtubeFixVideoList_' + this.getSteamID();
            console.log('Storage Key: ' + key);
            return key;
        },

        getSteamID: function() {
            let matches = $('html').html().match(/g_steamID = "([0-9]+)"/);
            return matches[1];
        },

        getObjectSize: function(obj)
        {
            let size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        },

        updateUploadVideos: function()
        {
            console.log('Video scan started ...');
            youtubeFixer.scanUploadVideos(1, function (videoList, maxPage) {
                if ((youtubeFixer.getObjectSize(youtubeFixer.videoList) > 0) && youtubeFixer.isHaveOldVideos(videoList)) {
                    youtubeFixer.finishUpdateVideos(videoList);
                } else {
                    youtubeFixer.scanUploadVideos(maxPage, function (videoList) {
                        youtubeFixer.videoList = {};
                        youtubeFixer.finishUpdateVideos(videoList);
                    });
                }
            });
        },

        init: function()
        {
            this.isInjected = true;
            console.log('Fix injected!');

            this.initVideoList();
            this.fixImportedVideoVisibility();
            this.updateUploadVideos();
        },

    }

    if (!youtubeFixer.isInjected) {
        youtubeFixer.init();
    }

}