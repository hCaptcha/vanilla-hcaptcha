import { loadJsApiIfNotAlready } from './api-loader';

const logPrefix = '[@hcaptcha/vanilla-hcaptcha]:';

class VanillaHCaptchaError extends Error {
    constructor(msg: string) {
        super(`${logPrefix}: ${msg}`);
        Object.setPrototypeOf(this, VanillaHCaptchaError.prototype);
    }
}

const errMsgs = {
    notRendered: `hCaptcha was not yet rendered. Please call "render()" first.`,
    apiNotLoaded(fnName: string): string {
        return `hCaptcha JS API was not loaded yet. Please wait for \`loaded\` event to safely call "${fnName}".`
    }
}

export interface VanillaHCaptchaJsApiConfig {

    /**
     * The hCaptcha JS API.
     * Default: "https://js.hcaptcha.com/1/api.js"
     */
    jsapi: string;

    /**
     * Default: true
     */
    sentry?: string;

    /**
     * Disable drop-in replacement for reCAPTCHA with false to prevent
     * hCaptcha from injecting into window.grecaptcha.
     * Default: true
     */
    recaptchacompat?: string;

    /**
     * hCaptcha auto-detects language via the user's browser.
     * This overrides that to set a default UI language.
     */
    hl?: string;

    endpoint?: string;
    reportapi?: string;
    assethost?: string;
    imghost?: string;
    host?: string;
}

type VanillaHCaptchaRenderConfig = Omit<ConfigRender,
    "callback" |
    "expired-callback" |
    "chalexpired-callback" |
    "error-callback" |
    "open-callback" |
    "close-callback">;

export class VanillaHCaptchaWebComponent extends HTMLElement {

    private hcaptchaId: HCaptchaId | undefined = undefined;
    private loadJsApiTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
    private jsApiLoaded = false;

    connectedCallback() {
        this.tryLoadingJsApi();
    }

    disconnectedCallback() {
        if (this.loadJsApiTimeout) {
            clearTimeout(this.loadJsApiTimeout);
        }
    }

    static get observedAttributes() {
        return [
            'jsapi',
            'host',
            'endpoint',
            'reportapi',
            'assethost',
            'imghost',
            'hl',
            'sentry',
            'recaptchacompat'
        ];
    }

    attributeChangedCallback(): void {
        this.tryLoadingJsApi();
    }

    private isJsApiConfigValid(jsApiConfig: VanillaHCaptchaJsApiConfig): boolean {
        const httpAttrs: (keyof VanillaHCaptchaJsApiConfig)[] = [ 'jsapi', 'host', 'endpoint' , 'reportapi', 'assethost', 'imghost' ];

        const invalidHttpAttrs = httpAttrs.some((attrName) => {
            return jsApiConfig[attrName] && !jsApiConfig[attrName]?.match(/^\w/);
        });

        let validApiConfig = !invalidHttpAttrs;

        if (jsApiConfig.hl && !jsApiConfig.hl.match(/[\w-]+/)) {
            validApiConfig = false;
        }

        if (jsApiConfig.sentry && ['true', 'false'].indexOf(jsApiConfig.sentry) === -1) {
            validApiConfig = false;
        }

        if (jsApiConfig.recaptchacompat && ['true', 'false'].indexOf(jsApiConfig.recaptchacompat) === -1) {
            validApiConfig = false;
        }

        return validApiConfig;
    }

    private tryLoadingJsApi(): void {
        const jsApiConfig = this.getJsApiConfig();
        const validApiConfig = this.isJsApiConfigValid(jsApiConfig);

        if(validApiConfig) {
            if (this.loadJsApiTimeout) {
                clearTimeout(this.loadJsApiTimeout);
            }

            // We use `setTimeout 1ms` to postpone js api load execution until all dynamic props are loaded.
            // Example: in case of react, dynamic attributes do not have a default like angular
            // which uses "{{value}}" notation, thus it cannot be known at component creation time
            // if values will be set async.
            this.loadJsApiTimeout = setTimeout(() => {
                if (this.jsApiLoaded) {
                    console.error(`${logPrefix} JS API attributes cannot change once hCaptcha JS API is loaded.`);
                }

                this.jsApiLoaded = true;

                loadJsApiIfNotAlready(jsApiConfig)
                    .then(this.onApiLoaded.bind(this))
                    .catch(this.onError.bind(this));
            }, 1);
        }
    }

    private getAttr(name: string): string | undefined {
        return this.getAttribute(name) || undefined;
    }

    private getJsApiConfig(): VanillaHCaptchaJsApiConfig {
        return {
            host: this.getAttr('host'),
            hl: this.getAttr('hl'),
            sentry: this.getAttr('sentry'),
            recaptchacompat: this.getAttr('recaptchacompat'),
            jsapi: this.getAttr('jsapi') || 'https://js.hcaptcha.com/1/api.js',
            endpoint: this.getAttr('endpoint'),
            reportapi: this.getAttr('reportapi'),
            assethost: this.getAttr('assethost'),
            imghost: this.getAttr('imghost'),
        };
    }

    private onApiLoaded(): void {
        this.onApiLoadedHandler();
        // Emit 'loaded' only after potential render.
        this.$emit('loaded');
    }

    private onApiLoadedHandler(): void {
        const autoRender = this.getAttr('auto-render') !== 'false';

        if (!autoRender) {
            return;
        }

        const rqdata = this.getAttr('rqdata');
        const tabindex = this.getAttr('tabindex');
        const sitekey = this.getAttr('sitekey') || this.getAttr('site-key');
        const attrChallengeContainer = this.getAttr('challenge-container');

        // Check required attributes are set when auto render is enabled
        if (!sitekey) {
            // Frontend frameworks might render the component with empty attributes when binding a value.
            // To avoid errors, simply stop the rendering process.
            // throw new VanillaHCaptchaError('Missing "sitekey" attribute. ');
            return;
        }

        const renderConfig: VanillaHCaptchaRenderConfig = {
            sitekey: sitekey,
            // @ts-ignore
            theme: this.getAttr('theme'),
            // @ts-ignore
            size: this.getAttr('size'),
            hl: this.getAttr('hl'),
            tplinks: this.getAttr('tplinks') === "off" ? "off" : "on",
            tabindex: tabindex ? parseInt(tabindex) : undefined,
            custom: this.getAttr('custom') === "true",
        };

        if (attrChallengeContainer) {
            renderConfig["challenge-container"] = attrChallengeContainer;
        }

        this.render(renderConfig);

        if (rqdata) {
            this.setData(rqdata);
        }
    }

    private onError(error: Error | string) {
        console.error(error);
        this.$emit('error', { error });
    }

    private $emit(eventName: string, obj?: object) {
        let event;
        if (typeof(Event) === 'function') {
            event = new Event(eventName);
        } else {
            event = document.createEvent('Event');
            event.initEvent(eventName, false, false);
        }
        obj && Object.assign(event, obj);
        this.dispatchEvent(event);
    }

    /**
     * Programmatically render the hCaptcha checkbox.
     * The config object must specify all required properties.
     * The web component attributes are ignored for more explicit behavior.
     * @param config
     */
    render(config: VanillaHCaptchaRenderConfig): void {
        if (!hcaptcha) {
            throw new VanillaHCaptchaError(errMsgs.apiNotLoaded('render'));
        }

        if (this.hcaptchaId) {
            console.warn(`${logPrefix} hCaptcha was already rendered. You may want to call 'reset()' first.`);
            return;
        }

        this.hcaptchaId = hcaptcha.render(this, {
            ...config,
            'callback': () => {
                const token = hcaptcha.getResponse(this.hcaptchaId);
                const eKey = hcaptcha.getRespKey(this.hcaptchaId);
                this.$emit('verified', { token, eKey, key: token });
            },
            'expired-callback': () => {
                this.$emit('expired');
            },
            'chalexpired-callback': () => {
                this.$emit('challenge-expired');
            },
            'error-callback': this.onError.bind(this),
            'open-callback': () => {
                this.$emit('opened');
            },
            'close-callback': () => {
                this.$emit('closed');
            },
        });
    }

    /**
     * Sets the rqdata.
     */
    setData(rqdata: string): void {
        if (!this.hcaptchaId) {
            throw new VanillaHCaptchaError(errMsgs.notRendered);
        }

        hcaptcha.setData(this.hcaptchaId, { rqdata });
    }

    /**
     * Triggers hCaptcha verification.
     */
    execute(): void {
        if (!hcaptcha) {
            throw new VanillaHCaptchaError(errMsgs.apiNotLoaded('execute'));
        }

        if (!this.hcaptchaId) {
            throw new VanillaHCaptchaError(errMsgs.notRendered);
        }

        hcaptcha.execute(this.hcaptchaId);
    }

    /**
     * Triggers a verification request.
     * Returns a Promise which resolved with the token results or throws in case of errors.
     */
    executeAsync(): Promise<HCaptchaResponse> {
        if (!hcaptcha) {
            throw new VanillaHCaptchaError(errMsgs.apiNotLoaded('execute'));
        }

        if (!this.hcaptchaId) {
            throw new VanillaHCaptchaError(errMsgs.notRendered);
        }

        return hcaptcha.execute(this.hcaptchaId, { async: true }) as Promise<HCaptchaResponse>;
    }

    /**
     * Resets the hCaptcha verification.
     */
    reset(): void {
        if (!hcaptcha) {
            throw new VanillaHCaptchaError(errMsgs.apiNotLoaded('reset'));
        }

        if (!this.hcaptchaId) {
            throw new VanillaHCaptchaError(errMsgs.notRendered);
        }

        hcaptcha.reset(this.hcaptchaId);
    }

}
