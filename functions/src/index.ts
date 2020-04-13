import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
//import * as nodemailer from 'nodemailer';
//import { google } from 'googleapis';
import * as sgMail from '@sendgrid/mail';

admin.initializeApp();

const MAX_NUMBER_OF_IMAGES = 6;

export const sendGrid = functions.https.onCall(async (data, context) => {
  sgMail.setApiKey(functions.config().mail.sendgrid.api_key);

  sgMail
    .send({
      from: 'lokalkauf < info@lokalkauf.org >',
      to: data.toEmail,
      subject: data.title,
      templateId: data.templateId,
      dynamicTemplateData: data.teplateVars,
    })
    .then(
      (result) => {
        console.log('Sent email');
      },
      (err) => {
        console.error(err);
      }
    );

  sgMail
    .send({
      from: 'lokalkauf < info@lokalkauf.org >',
      to: data.fromEmail,
      subject: data.title,
      templateId: data.templateIdCopy,
      dynamicTemplateData: data.teplateVars,
    })
    .then(
      (result) => {
        console.log('Sent email');
      },
      (err) => {
        console.error(err);
      }
    );
});

export const sendCustomVerifyMail = functions.auth
  .user()
  .onCreate(async (user) => {
    const url = functions.config().app.url;
    const apiKey = functions.config().app.apikey;

    let link = '';
    let parameter;

    if (typeof user.email === 'undefined') {
      return;
    }
    link = await admin.auth().generateEmailVerificationLink(user.email);
    parameter = link.split('&');
    const finalLink =
      url +
      '/verify?mode=verifyEmail&' +
      parameter.slice(1, 2) +
      '&apiKey=' +
      apiKey +
      '&lang=de';

    sgMail.setApiKey(functions.config().mail.sendgrid.api_key);

    sgMail
      .send({
        from: 'lokalkauf < info@lokalkauf.org >',
        to: user.email,
        subject: 'Bestätige deine E-Mail-Adresse für lokalkauf',
        templateId: 'd-e8b544e2d76242fdac65fafdae382e37',
        dynamicTemplateData: {
          verification_url: finalLink,
        },
      })
      .then(
        (result) => {
          console.log('Sent email');
        },
        (err) => {
          console.error(err);
        }
      );
  });

export const checkFileNumberLimit = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (object.name !== undefined) {
      const filePath = object.name;
      const bucket = admin.storage().bucket();
      const directory = filePath.split('/').slice(0, 2).join('/');

      bucket
        .getFiles({ directory: directory })
        .then(function (files) {
          if (files[0].length > MAX_NUMBER_OF_IMAGES) {
            console.log('Reachd max file num. Delete File...');
            bucket
              .file(filePath)
              .delete()
              .catch(() => {
                console.log('File delete faild');
              });
          }
        })
        .catch(() => console.log('Check faild'));
    }
  });

exports.deleteThumbnailsTriggeredByImageDeletion = functions.storage
  .object()
  .onDelete(async (snapshot, _context) => {
    //console.log('#######');
    //console.log('#######' + snapshot.name);

    if (
      snapshot.name &&
      snapshot.name.indexOf('/BusinessImages/') > -1 &&
      snapshot.name.indexOf('/BusinessImages/thumbs') < 0
    ) {
      const a = snapshot.name.indexOf('/BusinessImages/');

      console.log(`delete thumbnail of ${snapshot.name}`);

      let thumbnail: string;

      try {
        let name = snapshot.name.substring(a + '/BusinessImages/'.length);

        name =
          name.substring(0, name.lastIndexOf('.')) +
          '_200x200' +
          name.substring(name.lastIndexOf('.'));

        thumbnail =
          snapshot.name.substring(0, a) + '/BusinessImages/thumbs/' + name;

        admin
          .storage()
          .bucket()
          .deleteFiles({ prefix: thumbnail }, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log(`${thumbnail} successfull deleted`);
            }
          });
      } catch (e) {
        console.log(e);
      }
    }
  });

export const deleteUser = functions.auth.user().onDelete(async (user) => {
  admin
    .storage()
    .bucket()
    .deleteFiles({ prefix: `Traders/${user.uid}` }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log(
          `All the Firebase Storage files in users/${user.uid}/ have been deleted`
        );
      }
    });
  await admin.firestore().doc(`Traders/${user.uid}`).delete();
  console.log(`Deleted Firestore document Traders/${user.uid}`);
  await admin.firestore().doc(`locations/${user.uid}`).delete();
  console.log(`Deleted Firestore document locations/${user.uid}`);
});

export const backupFirestoreDatabaseToStorage = functions.pubsub
  .schedule('every day 00:00')
  .onRun(async (_context) => {
    const projectId = admin.app().options.projectId;
    const backupBucket = functions.config().app.backupbucket;
    const client = new admin.firestore.v1.FirestoreAdminClient();
    const databaseName = client.databasePath(projectId, '(default)');
    console.log(databaseName);
    return client
      .exportDocuments({
        name: databaseName,
        outputUriPrefix: backupBucket,
        collectionIds: [],
      })
      .then((responses: any) => {
        const response = responses[0];
        console.log(`Operation Name: ${response['name']}`);
        return true;
      })
      .catch((err: any) => {
        console.error(err);
        throw new Error('Export operation failed');
      });
});

function buildHtmlWithTrader (traderId:string, trader:any, imgUrl:string) {
  const url = functions.config().app.url;
  const string = '<!DOCTYPE html><head>' +
	'<title>lokalkauf | ' + trader.businessname + '</title>' +
	'<meta name="description" content="' + trader.description + '">' +
	'<meta property="twitter:title" content="lokalkauf | ' + trader.businessname + '">' +
	'<meta name="twitter:card" content="summary" />' +
	'<meta name="twitter:description" content="' + trader.description + '" />' +
	'<meta name="twitter:image" content="' + imgUrl + '" />' +
	'<meta name="twitter:site" content="@loaklkauf" />' +
	'<meta name="twitter:creator" content="@lokalkauf" />' +
	'<meta property="og:title" content="lokalkauf | ' + trader.businessname + '">' +
	'<meta property="og:image" itemprop="image" content="' + imgUrl + '" />' +
	'<meta property="og:image:width" content="200" />' +
	'<meta property="og:image:height" content="200" />' +
	'<meta property="og:type" content="web app" />' +
	'<meta property="og:description" content="' + trader.description + '" />' +
	'<link rel="icon" href="https://lokalkauf-staging.web.app/assets/logo.png">' +
	'</head><body>' +
	'<script>window.location.replace("' + url + '/redirect/trader-detail/' + traderId + '");</script>' +
	'</body></html>';
  return string;
}

function getPathToThumbnail(path:string){
    const prefix = path.split('/').slice(0, -1).join('/');
    const filename = path.split('/').slice(-1).join().split('.').slice(0, -1).join('.');
    const fileExtension = path.split('/').slice(-1).join().split('.').slice(-1).join();
    return prefix + "/thumbs/" + filename + "_200x200." + fileExtension
}

export const traderDetail = functions.https.onRequest(async (req, res) => {
    const path = req.path.split('/');
    const traderId = path[2];
    const documentRef = admin.firestore().doc("Traders/" + traderId)
    const trader = await documentRef.get()
	.then((snapshot:any) => {
	    return snapshot.data()
	})
	.catch((err:any) => {
	    console.log('Error getting documents', err);
	});
    const bucket = admin.storage().bucket();
    const url = await "https://firebasestorage.googleapis.com/v0/b/" + bucket.name + "/o/" + encodeURIComponent(getPathToThumbnail(trader.defaultImagePath)) + "?alt=media";
    res.status(200).send(buildHtmlWithTrader(traderId, trader, url));
});
