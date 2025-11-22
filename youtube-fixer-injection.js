"use strict";

(function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const INJECT_MARK = 'data-youtube-fixer-injected';
    const root = document.documentElement;
    if (root.hasAttribute(INJECT_MARK)) return;
    root.setAttribute(INJECT_MARK, '1');

    const youtubeFixer = {

        isInjected: false,

        videoList: {},

        lastVideoList: {},

        getVideoPage: function (pageNum, callback) {
            const p = Number(pageNum) > 0 ? Number(pageNum) : 1;
            $.get('/my/videos/?p=' + p, (data) => {
                if (typeof callback === 'function') callback(data);
            });
        },

        initVideoList: function () {
            try {
                const raw = window.localStorage.getItem(youtubeFixer.getStorageKey());
                this.videoList = raw ? JSON.parse(raw) : {};
            } catch (e) {
                this.videoList = {};
            }
        },

        fixImportedVideoVisibility: function () {
            const $itemList = $('#add_vid_list .add_vid_list_entry');
            const $inputList = $('#add_vid_list .add_vid_list_entry input.vid_cb');
            let removedCount = 0;
            for (let i = 0; i < $itemList.length; i++) {
                const $img = $($inputList[i]);
                const youtubeId = $img.attr('value');
                if (Object.prototype.hasOwnProperty.call(youtubeFixer.videoList, youtubeId)) {
                    const $item = $itemList[i];
                    $item.remove();
                    removedCount++;
                }
            }
            // eslint-disable-next-line no-console
            console.log('Wrong videos removed!' + (removedCount > 0 ? ' (' + removedCount + ')' : ''));
            // Show a small toast message on the page as well
            // Display it only if the DOM was actually modified (optional nice UX)
            youtubeFixer.showToast('Wrong videos removed!' + (removedCount > 0 ? ' (' + removedCount + ')' : ''));
        },

        matchYoutubeId: function (text) {
            if (!text) return null;
            const matches = text.match(/\/vi\/([a-zA-Z0-9_\-]+)\/mqdefault/);
            return matches && matches[1] ? matches[1] : null;
        },

        scanUploadVideosRecursive: function (pageNum, videoList, maxPage, callback) {
            if (pageNum > 0) {
                // eslint-disable-next-line no-console
                console.log('Page #' + pageNum);
                this.getVideoPage(pageNum, (data) => {
                    const $page = $($.parseHTML(data));
                    const $itemList = $page.find('.video_item a.profile_media_item');
                    for (let i = 0; i < $itemList.length; i++) {
                        const $item = $itemList[i];
                        const matches = $item.href && $item.href.match(/\?id=(\d+)/);
                        if (!matches || !matches[1]) continue;
                        const steamId = matches[1];
                        const $img = $page.find('#imgWallItem_' + steamId + ' img');
                        const youtubeId = youtubeFixer.matchYoutubeId($img.attr('src'));
                        if (!youtubeId) continue;
                        if (!Object.prototype.hasOwnProperty.call(videoList, youtubeId)) {
                            videoList[youtubeId] = steamId;
                        } else {
                            // eslint-disable-next-line no-console
                            console.log('Duplication: ' + $item.href);
                        }
                    }
                    const pageMax = $page.find('a.pagingPageLink').last().text();
                    youtubeFixer.scanUploadVideosRecursive(pageNum - 1, videoList, pageMax, callback);
                });
            } else {
                if (typeof callback === 'function') callback(videoList, maxPage);
            }
        },

        scanUploadVideos: function (maxPage, callback) {
            youtubeFixer.scanUploadVideosRecursive(maxPage, {}, null, callback);
        },

        isHaveOldVideos: function (videoList) {
            for (const youtubeId in videoList) {
                if (Object.prototype.hasOwnProperty.call(youtubeFixer.videoList, youtubeId)) {
                    return true;
                }
            }
            return false;
        },

        finishUpdateVideos: function (videoList) {
            for (const youtubeId in videoList) {
                if (Object.prototype.hasOwnProperty.call(videoList, youtubeId)) {
                    youtubeFixer.videoList[youtubeId] = videoList[youtubeId];
                }
            }
            try {
                window.localStorage.setItem(youtubeFixer.getStorageKey(), JSON.stringify(youtubeFixer.videoList));
            } catch (_) {
                // ignore quota or access errors
            }
            // eslint-disable-next-line no-console
            console.log('Video scan finished!');
            // Show toast notification when scan is finished
            youtubeFixer.showToast('Video scan finished!');
            youtubeFixer.fixImportedVideoVisibility();
        },

        getStorageKey: function () {
            const key = 'youtubeFixVideoList_' + this.getSteamID();
            // eslint-disable-next-line no-console
            console.log('Storage Key: ' + key);
            return key;
        },

        getSteamID: function () {
            const html = $('html').html() || '';
            const matches = html.match(/g_steamID\s*=\s*"([0-9]+)"/);
            return matches && matches[1] ? matches[1] : 'unknown';
        },

        getObjectSize: function (obj) {
            if (!obj) return 0;
            return Object.keys(obj).length;
        },

        updateUploadVideos: function () {
            // eslint-disable-next-line no-console
            console.log('Video scan started ...');
            // Show toast notification when scan starts
            youtubeFixer.showToast('Video scan started ...');
            youtubeFixer.scanUploadVideos(1, (videoList, maxPage) => {
                if ((youtubeFixer.getObjectSize(youtubeFixer.videoList) > 0) && youtubeFixer.isHaveOldVideos(videoList)) {
                    youtubeFixer.finishUpdateVideos(videoList);
                } else {
                    youtubeFixer.scanUploadVideos(maxPage, (list) => {
                        youtubeFixer.videoList = {};
                        youtubeFixer.finishUpdateVideos(list);
                    });
                }
            });
        },

        // Creates and shows a floating, self-dismissing toast message on the page
        showToast: function (message, timeoutMs) {
            try {
                const doc = document;
                if (!doc || !doc.body) return;

                // Ensure container exists
                let container = doc.getElementById('youtube-fixer-toast-container');
                if (!container) {
                    container = doc.createElement('div');
                    container.id = 'youtube-fixer-toast-container';
                    // container styles
                    container.style.position = 'fixed';
                    container.style.top = '20px';
                    container.style.right = '20px';
                    container.style.zIndex = '2147483647'; // on top
                    container.style.display = 'flex';
                    container.style.flexDirection = 'column';
                    container.style.alignItems = 'flex-end';
                    container.style.gap = '8px';
                    container.style.pointerEvents = 'none'; // allow clicks to pass except on toasts
                    container.style.maxWidth = 'min(90vw, 420px)';
                    doc.body.appendChild(container);
                }

                const toast = doc.createElement('div');
                toast.textContent = String(message || '').trim() || 'Notification';
                toast.style.background = 'rgba(44, 44, 44, 0.95)';
                toast.style.color = '#fff';
                toast.style.padding = '10px 14px';
                toast.style.borderRadius = '8px';
                toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
                toast.style.font = '13px/1.4 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif';
                toast.style.pointerEvents = 'auto';
                toast.style.cursor = 'pointer';
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-6px)';
                toast.style.transition = 'opacity .25s ease, transform .25s ease';

                // Close on click immediately
                toast.addEventListener('click', function () {
                    try {
                        toast.style.opacity = '0';
                        toast.style.transform = 'translateY(-6px)';
                        setTimeout(function () { toast.remove(); }, 300);
                    } catch (_) { /* ignore */ }
                });

                container.appendChild(toast);

                // Animate in next frame
                requestAnimationFrame(function () {
                    toast.style.opacity = '1';
                    toast.style.transform = 'translateY(0)';
                });

                const hideAfter = Math.max(1500, Number(timeoutMs) || 3500);
                setTimeout(function () {
                    try {
                        toast.style.opacity = '0';
                        toast.style.transform = 'translateY(-6px)';
                        setTimeout(function () { toast.remove(); }, 350);
                    } catch (_) { /* ignore */ }
                }, hideAfter);
            } catch (_) {
                // silent fail to not break page
            }
        },

        init: function () {
            this.isInjected = true;
            // eslint-disable-next-line no-console
            console.log('Fix injected!');

            if (typeof $ === 'undefined') {
                // eslint-disable-next-line no-console
                console.warn('jQuery is not available. youtubeFixer cannot run.');
                return;
            }

            this.initVideoList();
            this.fixImportedVideoVisibility();
            this.updateUploadVideos();
        },

    };

    if (!youtubeFixer.isInjected) {
        youtubeFixer.init();
    }
})();