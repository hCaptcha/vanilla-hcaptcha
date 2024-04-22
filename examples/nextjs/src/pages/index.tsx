import { useState, createRef, useEffect } from 'react';

export default function Home() {
    const [token, setToken] = useState('');
    const sitekey = '781559eb-513a-4bae-8d29-d4af340e3624';
    const jsapi = 'https://js.hcaptcha.com/1/api.js';
    const captchaRef = createRef<HTMLElement>();

    useEffect(() => {
        console.warn('next.js in dev mode will call useEffect twice. Link: https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development');

        import('@hcaptcha/vanilla-hcaptcha');

        if (captchaRef.current) {
            captchaRef.current.addEventListener('verified', (e: Event) => {
                // @ts-ignore
                const token = e.token;
                console.log('hCaptcha event: verified', { token });
                setToken(token);
            });

            captchaRef.current.addEventListener('closed', () => {
                console.log('hCaptcha event: closed');
            });

            captchaRef.current.addEventListener('error', (e: Event) => {
                console.log('hCaptcha event: error', e);
            });
        }
    }, []);

    return (
    <main>
        <div>hCaptcha size: normal, theme: dark</div>
        <h-captcha
            ref={captchaRef}
            sitekey={sitekey}
            jsapi={jsapi}
            host="example.com"
            size="normal"
            theme="dark"
        ></h-captcha>

        <div>Token:</div>
        <div>{token}</div>
    </main>
    );
}
