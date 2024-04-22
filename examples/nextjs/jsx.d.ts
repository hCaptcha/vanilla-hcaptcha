import * as React from 'react';

declare global {
    declare namespace JSX {
        interface IntrinsicElements {
            'h-captcha': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                [k: string]: unknown;
            }, HTMLElement>;
        }
    }
}
