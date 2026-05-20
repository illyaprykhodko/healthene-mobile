import { VIDEO_MIME } from './assets';

export type DualVideoWebViewHtmlOptions = {
    domReadyMessage: string;
    width: number;
    height: number;
};

export function createDualVideoWebViewHtml ({
    domReadyMessage,
    width,
    height,
}: DualVideoWebViewHtmlOptions): string {
    return `
        <html>
            <head>
                <meta name="viewport" content="width=${width}, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body {
                        width: ${width}px;
                        height: ${height}px;
                        background: transparent;
                        overflow: hidden;
                    }
                    #videoContainer {
                        position: relative;
                        width: ${width}px;
                        height: ${height}px;
                        overflow: hidden;
                    }
                    video {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: ${width}px;
                        height: ${height}px;
                        object-fit: contain;
                    }
                </style>
                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        var va = document.getElementById("video-a");
                        var vb = document.getElementById("video-b");
                        va.style.opacity = "1";
                        va.style.zIndex = "2";
                        vb.style.opacity = "1";
                        vb.style.zIndex = "1";
                        window.__ACTIVE = va;
                        window.__INACTIVE = vb;
                        window.__VIDEO__ = va;
                        window.__FRAME_SHOWN = false;
                        window.ReactNativeWebView.postMessage("${domReadyMessage}");
                    });
                </script>
            </head>
            <body>
                <div id="videoContainer">
                    <video id="video-a" playsinline webkit-playsinline>
                        <source type="${VIDEO_MIME}" />
                    </video>
                    <video id="video-b" playsinline webkit-playsinline>
                        <source type="${VIDEO_MIME}" />
                    </video>
                </div>
            </body>
        </html>
    `;
}
