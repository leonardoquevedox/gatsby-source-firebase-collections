const firebase = require('firebase');
const crypto = require('crypto');

const graphqlDefaults = require('graphql-defaults');

const genGraphQLDefaults = graphqlDefaults.default;
const { genTypesDefinitionsMaps } = graphqlDefaults;

const getDigest = id =>
  crypto
    .createHash('md5')
    .update(id)
    .digest('hex');

exports.sourceNodes = async (
  { boundActionCreators },
  { types = [], credential, appConfig },
  callback
) => {
  try {
    if (firebase.apps || !firebase.apps.length) {
      const config = appConfig || {
        credential: firebase.credential.cert(credential),
      };
      firebase.initializeApp(config);
    }

    const db = firebase.firestore();
    const { createNode } = boundActionCreators;

    for (let i = 0; i < types.length; i++) {
      const entry = types[i];
      if (entry) {
        const {
          collection = '',
          type = '',
          map = node => node,
          definition,
        } = entry;
        const snapshot = await db.collection(collection).get();
        let defaultValues = {};

        if (definition) {
          defaultValues = genTypesDefinitionsMaps(definition);
        }

        createNode(
          Object.assign(defaultValues, {
            id: '0',
            parent: null,
            children: [],
            values: {},
            internal: {
              type,
              contentDigest: getDigest(`test-${collection}`),
            },
          })
        );

        for (let doc of snapshot.docs) {
          const contentDigest = getDigest(doc.id);
          createNode(
            Object.assign(
              {
                values: {},
              },
              map(doc.data()),
              {
                id: doc.id,
                parent: null,
                children: [],
                internal: {
                  type,
                  contentDigest,
                },
              }
            )
          );
        }
      }
    }
  } catch (e) {
    console.log(e);
  } finally {
    callback();
  }
};
