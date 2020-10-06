const report = require('gatsby-cli/lib/reporter');
const firebase = require('firebase');
const crypto = require('crypto');

const getDigest = (id) => crypto.createHash('md5').update(id).digest('hex');

exports.sourceNodes = async (
  { boundActionCreators },
  { types, credential, appConfig }
) => {
  try {
    if (firebase.apps || !firebase.apps.length) {
      const cfg = appConfig
        ? appConfig
        : { credential: firebase.credential.cert(credential) };
      firebase.initializeApp(cfg);
    }
  } catch (e) {
    report.warn(
      'Could not initialize Firebase. Please check `credential` property in gatsby-config.js'
    );
    report.warn(e);
    return;
  }

  const db = firebase.firestore();
  const { createNode } = boundActionCreators;

  const promises = types.map(
    ({ collection, type, map = (node) => node }) =>
      new Promise(async (resolve, reject) => {
        try {
          const snapshot = await db.collection(collection).get();

          for (let doc of snapshot.docs) {
            const contentDigest = getDigest(doc.id);

            createNode(
              Object.assign({}, map(doc.data()), {
                id: doc.id,
                parent: null,
                children: [],
                internal: {
                  type,
                  contentDigest,
                },
              })
            );
            resolve();
          }
        } catch (e) {
          console.log(e);
          resolve();
        }
      })
  );

  await Promise.all(promises);
  return;
};
