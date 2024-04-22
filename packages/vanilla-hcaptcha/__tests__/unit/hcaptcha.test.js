import '../../dist/index.min.js';

const mockCaptchaId = 42069;
const mockToken = 'mock-hcaptcha-token';
const mockEkey = 'mock-hcaptcha-ekey';

describe('hCaptcha Vanilla Web Component', () => {
    let hCaptchaEl, renderObj;

    beforeEach(async () => {
        window.hcaptcha = {
            getResponse: jest.fn().mockReturnValue(mockToken),
            getRespKey: jest.fn().mockReturnValue(mockEkey),
            render: jest.fn().mockReturnValue(mockCaptchaId),
            execute: jest.fn(),
            reset: jest.fn(),
            remove: jest.fn(),
            setData: jest.fn(),
        };

        console.warn = jest.fn();
        console.error = jest.fn();

        document.body.innerHTML = `
            <h-captcha id="signupCaptcha"
                       site-key="10000000-ffff-ffff-ffff-000000000001"></h-captcha>`;
        hCaptchaEl = document.getElementById('signupCaptcha');
        await new Promise((resolve) => {
            // Render happens async, thus the use of `setTimeout`
            setTimeout(() => {
                renderObj = window.hcaptcha.render.mock.calls[ 0 ][ 1 ];
                resolve();
            }, 0);
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should emit "loaded" event', (done) => {
        document.body.innerHTML = `
            <h-captcha id="signupCaptcha2"
                       site-key="10000000-ffff-ffff-ffff-000000000001"></h-captcha>`;
        const hCaptchaEl2 = document.getElementById('signupCaptcha2');
        hCaptchaEl2.addEventListener('loaded', () => done());
    });

    it('should emit "verified" event', (done) => {
        hCaptchaEl.addEventListener('verified', (e) => {
            expect(e.key).toBe(mockToken);
            expect(e.token).toBe(mockToken);
            expect(e.eKey).toBe(mockEkey);
            done();
        });
        // Simulate hcaptcha success flow
        renderObj['callback']();
    });

    it('should emit "error" event', (done) => {
        const mockError = 'invalid-site-key';
        hCaptchaEl.addEventListener('error', (e) => {
            expect(e.error).toBe(mockError);
            done();
        });
        // Simulate hcaptcha error flow
        renderObj['error-callback'](mockError);
    });

    it('should emit "expired" event', (done) => {
        hCaptchaEl.addEventListener('expired', () => {
            done();
        });
        // Simulate hcaptcha verification expired
        renderObj['expired-callback']();
    });

    it('should emit "challenge-expired" event', (done) => {
        hCaptchaEl.addEventListener('challenge-expired', () => {
            done();
        });
        // Simulate hcaptcha challenge expired flow
        renderObj['chalexpired-callback']();
    });

    it('should proxy "execute" method', () => {
        hCaptchaEl.execute();
        expect(window.hcaptcha.execute).toHaveBeenCalledWith(mockCaptchaId);
    });

    it('should proxy "execute" method (async)', () => {
        hCaptchaEl.executeAsync();
        expect(window.hcaptcha.execute).toHaveBeenCalledWith(mockCaptchaId, { async: true });
    });

    it('should proxy "reset" method', () => {
        hCaptchaEl.reset();
        expect(window.hcaptcha.reset).toHaveBeenCalledWith(mockCaptchaId);
    });

    it('should proxy "setData" method', () => {
        const mockRqData = 'invalid-site-key';
        hCaptchaEl.setData(mockRqData);
        expect(window.hcaptcha.setData).toHaveBeenNthCalledWith(1, mockCaptchaId, { rqdata: mockRqData });
    });

    it('should automatically render the checkbox', (done) => {
        document.body.innerHTML = `
            <h-captcha id="signupCaptcha2"
                       site-key="10000000-ffff-ffff-ffff-000000000001"></h-captcha>`;
        const hCaptchaEl2 = document.getElementById('signupCaptcha2');
        hCaptchaEl2.addEventListener('loaded', () => done());
    });

    it('should use dynamic jsapi attribute', async () => {
        const hcaptcha = window.hcaptcha;
        delete window.hcaptcha;
        delete window._hCaptchaOnLoadPromise;

        const scriptElement = document.createElement("script");

        jest.spyOn(document, "createElement").mockImplementation((tagName) => {
            if (tagName === 'script') {
                // Simulate js api onload.
                window._hCaptchaOnLoad();
                window.hcaptcha = hcaptcha;
                return scriptElement;
            }
            throw new Error("Unexpected tag name to be mocked.");
        });

        document.body.innerHTML = `<h-captcha id="signupCaptcha2" site-key="10000000-ffff-ffff-ffff-000000000001"></h-captcha>`;

        document.getElementById("signupCaptcha2").setAttribute("jsapi", "https://example.hcaptcha.com/1/api.js");

        const hCaptchaEl2 = document.getElementById('signupCaptcha2');

        await new Promise((resolve, reject) => {
            hCaptchaEl2.addEventListener("loaded", () => resolve());
            setTimeout(() => reject("failed to load js api in time"), 1);
        });

        expect(scriptElement.src).toEqual("https://example.hcaptcha.com/1/api.js?render=explicit&onload=_hCaptchaOnLoad&sentry=true");
    });

});
