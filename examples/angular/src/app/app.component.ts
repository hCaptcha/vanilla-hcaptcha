import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  token = '';
  siteKey = '781559eb-513a-4bae-8d29-d4af340e3624';
  jsapi = 'https://js.hcaptcha.com/1/api.js';
  recaptchacompat = false;

  onCaptchaVerified(e: Event) {
    console.log('verified event', e);
    // @ts-ignore
    this.token = e.token;
  }

  onCaptchaError(e: Event) {
    console.log('error event', e);
  }

  onCaptchaClosed() {
    console.log('hCaptcha closed');
  }
}
