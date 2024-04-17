import { VanillaHCaptchaJsApiConfig } from "./hcaptcha";

declare global {
    interface Window {
        _hCaptchaOnLoad?: Function;
        _hCaptchaOnLoadPromise?: Promise<void>;
    }
}

/**
 * Loads the hCaptcha JS API only once on the page despite multiple attempts.
 *
 * Usage:
 * 1. import hcaptchaScript from './hcaptcha-script';
 * 2. when web component is mounted do:
 *      loadJsApiIfNotAlready(HCaptchaConfig)
 *        .then(() => console.log('hcaptcha is loaded, so it is safe to be used'))
 *        .catch((err) => console.error('failed to load the hcaptcha', err));
 */
export function loadJsApiIfNotAlready(config: VanillaHCaptchaJsApiConfig): Promise<void> {
    if (window._hCaptchaOnLoadPromise) {
        return window._hCaptchaOnLoadPromise;
    } else if (window.hcaptcha) {
        console.warn("[@hcaptcha/vanilla-hcaptcha]: hCaptcha JS API detected to be externally loaded. " +
            "Unless you know what are you doing, this task should be delegated to this web component.");
        window._hCaptchaOnLoadPromise = Promise.resolve();
        return window._hCaptchaOnLoadPromise;
    } else {
        let resolveFn: Function;
        let rejectFn: Function;
        window._hCaptchaOnLoadPromise = new Promise((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = reject;
        });
        window._hCaptchaOnLoad = resolveFn;
        const scriptSrc = getScriptSrc(config);
        const script = document.createElement('script');
        script.src = scriptSrc;
        script.async = true;
        script.defer = true;
        script.onerror = (event) => {
            const errMsg = `Failed to load hCaptcha JS API: "${scriptSrc}"`;
            // eslint-disable-next-line no-console
            console.error(errMsg, event);
            rejectFn(errMsg);
        };
        document.head.appendChild(script);
        return window._hCaptchaOnLoadPromise;
    }
}

function getScriptSrc(config: VanillaHCaptchaJsApiConfig) {
    let scriptSrc = config.jsapi;
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'render', 'explicit');
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'onload', '_hCaptchaOnLoad');
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'recaptchacompat', config.recaptchacompat === 'false' ? 'off' : null);
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'host', config.host);
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'hl', config.hl);
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'sentry', config.sentry === 'false' ? 'false' : 'true');
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'endpoint', config.endpoint);
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'assethost', config.assethost);
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'imghost', config.imghost);
    scriptSrc = addQueryParamIfDefined(scriptSrc, 'reportapi', config.reportapi);
    return scriptSrc;
}

function addQueryParamIfDefined(url: string, queryName: string, queryValue: string) {
    if (queryValue !== undefined && queryValue !== null) {
        const link = url.includes('?') ? '&' : '?';
        return url + link + queryName + '=' + encodeURIComponent(queryValue);
    }
    return url;
}
