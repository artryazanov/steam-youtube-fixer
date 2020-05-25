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
            this.videoList = JSON.parse(window.localStorage.getItem('youtubeFixVideoList'));
            if (this.videoList === null) {
                this.videoList = {};
            }
        },

        fixImportedVideoVisibility: function() {
            let $itemList = $('#add_vid_list .add_vid_list_entry');
            let $imageList = $('#add_vid_list .add_vid_list_entry img');
            for (let i = 0; i < $itemList.length; i++) {
                let $img = $($imageList[i]);
                let youtubeId = youtubeFixer.matchYoutubeId($img.attr('src'));
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

        scanUploadVideos: function(pageNum, videoList, callback)
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
                    youtubeFixer.scanUploadVideos(--pageNum, videoList, callback);
                })
            } else {
                !!callback && callback(videoList);
            }
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
            window.localStorage.setItem('youtubeFixVideoList', JSON.stringify(youtubeFixer.videoList));
            console.log('Video scan finished!');
            youtubeFixer.fixImportedVideoVisibility();
        },

        updateUploadVideos: function()
        {
            console.log('Video scan started ...');
            youtubeFixer.scanUploadVideos(1, {}, function (videoList) {
                if (youtubeFixer.isHaveOldVideos(videoList)) {
                    youtubeFixer.finishUpdateVideos(videoList);
                } else {
                    youtubeFixer.scanUploadVideos(4, {}, function (videoList) {
                        if (youtubeFixer.isHaveOldVideos(videoList)) {
                            youtubeFixer.finishUpdateVideos(videoList);
                        } else {
                            youtubeFixer.getVideoMaxPage(function(videoMaxPage) {
                                youtubeFixer.scanUploadVideos(videoMaxPage, {}, function (videoList) {
                                    youtubeFixer.videoList = {};
                                    youtubeFixer.finishUpdateVideos(videoList);
                                });
                            })
                        }
                    });
                }
            });
        },

        /*
        injectFixBlock: function()
        {
            $('#add_right_col3').after('' +
                '<div id="add_right_col3">' +
                '   <a id="fix_video_button" href="#" class="btn_grey_white_innerfade btn_medium fl_left"><span>Fix YouTube video list</span></a>' +
                '</div>');

            $('#fix_video_button').click(function() {
                console.log('Video scan started ...');
                youtubeFixer.scanUploadVideos(4, {}, function (videoList) {
                    if (youtubeFixer.isHaveOldVideos(videoList)) {
                        for(let youtubeId in videoList) {
                            youtubeFixer.videoList[youtubeId] = videoList[youtubeId];
                        }
                    } else {
                        youtubeFixer.getVideoMaxPage(function(videoMaxPage) {
                            youtubeFixer.scanUploadVideos(videoMaxPage, {}, function (videoList) {
                                youtubeFixer.videoList = videoList;
                                window.localStorage.setItem('youtubeFixVideoList', JSON.stringify(youtubeFixer.videoList));
                                youtubeFixer.fixImportedVideoVisibility();
                                console.log('Video scan finished!');
                            });
                        })
                    }
                });
                return false;
            });
        },
        */

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