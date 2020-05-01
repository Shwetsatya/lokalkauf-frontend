// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    // apiKey: 'AIzaSyBb_aChDOeE6L2vYyzluSgtDlQY04vlB00',
    // databaseURL: 'https://lokalkauf-security-testing.firebaseio.com',
    // projectId: 'lokalkauf-security-testing',
    // storageBucket: 'lokalkauf-security-testing.appspot.com'

    apiKey: 'AIzaSyDWKZmGX7RaxDfv8_s_mqA_Ct9iFSP2GiM',
    databaseURL: 'https://lokalkauf-staging.firebaseio.com',
    projectId: 'lokalkauf-staging',
    storageBucket: 'lokalkauf-staging.appspot.com',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
