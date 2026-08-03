import { VIDEO_MIME } from './assets';
import { WEBVIEW_VIDEO_MESSAGE } from './messages';

export type SwapClipScriptOptions = {
    base64: string;
    phaseTag: string;
    muted: boolean;
    loopInPage?: boolean;
    postEnded?: boolean;
    endedMessageType?: string;
    clipStyleJs?: string;
    afterSwapPlainMessage?: string;
};

export function buildSwapClipScript ({
    base64,
    phaseTag,
    muted,
    loopInPage = false,
    postEnded = true,
    endedMessageType = WEBVIEW_VIDEO_MESSAGE.VIDEO_ENDED,
    clipStyleJs = '',
    afterSwapPlainMessage,
}: SwapClipScriptOptions): string {
    const postEndedJs = postEnded
        ? `target.onended = function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: "${endedMessageType}",
                    phase: phaseTag
                }));
            };`
        : loopInPage
            ? `target.onended = function() {
                try { target.currentTime = 0; target.play(); } catch(e) {}
            };`
            : 'target.onended = null;';

    const afterSwapJs = afterSwapPlainMessage
        ? `try { window.ReactNativeWebView.postMessage("${afterSwapPlainMessage}"); } catch (e) {}`
        : '';

    return `
(function() {
    try {
        if (!window.__ACTIVE || !window.__INACTIVE) { true; return; }
        var active = window.__ACTIVE;
        var inactive = window.__INACTIVE;
        var firstFrame = !window.__FRAME_SHOWN;
        var target = firstFrame ? active : inactive;

        window.__injectGen = (window.__injectGen || 0) + 1;
        var myGen = window.__injectGen;

        if (window.__birdSitNearEnd) {
            active.removeEventListener("timeupdate", window.__birdSitNearEnd);
            inactive.removeEventListener("timeupdate", window.__birdSitNearEnd);
            active.removeEventListener("seeked", window.__birdSitSeeked);
            inactive.removeEventListener("seeked", window.__birdSitSeeked);
            window.__birdSitNearEnd = null;
            window.__birdSitSeeked = null;
        }

        var phaseTag = "${phaseTag}";
        target.loop = false;
        target.removeAttribute("loop");
        target.onended = null;
        target.muted = ${muted ? 'true' : 'false'};
        target.style.transform = "none";
        target.style.transformOrigin = "center";
        target.style.objectFit = "contain";
        target.style.opacity = firstFrame ? "1" : "0";
        ${clipStyleJs.replace(/inactive\./g, 'target.')}

        ${postEndedJs}

        var source = target.querySelector("source");
        if (!source) {
            source = document.createElement("source");
            source.type = "${VIDEO_MIME}";
            target.appendChild(source);
        }
        target.pause();
        source.src = "data:${VIDEO_MIME};base64,${base64}";
        target.load();

        function showTarget() {
            if (window.__injectGen !== myGen) { return; }
            requestAnimationFrame(function() {
                if (window.__injectGen !== myGen) { return; }
                if (!firstFrame) {
                    active.style.opacity = "0";
                    active.style.zIndex = "1";
                    active.pause();
                    active.onended = null;
                    target.style.opacity = "1";
                    target.style.zIndex = "2";
                    window.__ACTIVE = target;
                    window.__INACTIVE = target === active ? inactive : active;
                    window.__VIDEO__ = target;
                }
                window.__FRAME_SHOWN = true;
                target.play();
                ${afterSwapJs}
            });
        }

        var readyFired = false;
        function onReadyOnce() {
            if (readyFired || window.__injectGen !== myGen) { return; }
            readyFired = true;
            target.removeEventListener("canplay", onReadyOnce);
            target.removeEventListener("loadeddata", onReadyOnce);
            showTarget();
        }
        target.addEventListener("canplay", onReadyOnce);
        target.addEventListener("loadeddata", onReadyOnce);
    } catch (e) {
        console.log("webViewVideo swap error", e);
    }
    true;
})();
`;
}

export function buildSetMutedScript (muted: boolean): string {
    return `(function(){
        if (window.__ACTIVE) { window.__ACTIVE.muted = ${muted ? 'true' : 'false'}; }
        if (window.__INACTIVE) { window.__INACTIVE.muted = ${muted ? 'true' : 'false'}; }
        true;
    })();`;
}

export function buildResumeActiveScript (): string {
    return `(function(){
        if (window.__ACTIVE && window.__ACTIVE.paused) { window.__ACTIVE.play(); }
        true;
    })();`;
}

export function buildSeekActiveToStartScript (): string {
    return `(function(){
        if (window.__ACTIVE) {
            window.__ACTIVE.currentTime = 0;
            window.__ACTIVE.play();
        }
        true;
    })();`;
}

export function injectSwapClip (
    webViewRef: { current: { injectJavaScript: (js: string) => void } | null },
    options: SwapClipScriptOptions,
): void {
    webViewRef.current?.injectJavaScript(buildSwapClipScript(options));
}
