import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLicense } from '@syncfusion/ej2-base';

registerLicense('Ngo9BigBOggjHTQxAR8/V1JFaF1cX2hIf0x3TXxbf1x1ZFREalhTTnRXUiweQnxTdEBiWX5XcHRRRGNZUEZyXUleYg=='); // 👈 pega aquí la key que copiaste


bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
