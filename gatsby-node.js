const firebase = require('firebase');
const crypto = require('crypto');
const { createRemoteFileNode } = require('gatsby-source-filesystem');

const getImageExtension = (value = '') =>
  ['jpeg', 'jpg', 'png', 'webp'].filter(extension => {
    return value.indexOf(extension) > -1;
  })[0];

const isBucketImage = (value = '') =>
  typeof value === 'string' &&
  value.indexOf('firebasestorage') > -1 &&
  getImageExtension(value);

const transformPropertyOnMatch = (source, isMatch, transform) => {
  return Promise.all(
    Object.keys(source).map(
      key =>
        new Promise(async (resolve, reject) => {
          try {
            // eslint-disable-next-line
            if (isMatch(source[key])) {
              source[key] = await transform(key, source[key]);
            } else if (typeof source[key] === 'object') {
              await transformPropertyOnMatch(source[key], isMatch, transform);
            }
            resolve(source);
          } catch (e) {
            console.log(e);
          }
        })
    )
  );
};

const replaceImageUrlsWithFile = async (
  node,
  { createNode, store, cache, createNodeId }
) => {
  await transformPropertyOnMatch(
    node,
    isBucketImage,
    (key, value) =>
      new Promise(async (resolve, reject) => {
        const ext = getImageExtension(value);
        console.log(ext);
        // console.log('Creating remote file node for', value)
        // For all MarkdownRemark nodes that have a featured image url, call createRemoteFileNode
        let fileNode = await createRemoteFileNode({
          url: value, // string that points to the URL of the image
          parentNodeId: node.id, // id of the parent node of the fileNode you are going to create
          createNode, // helper function in gatsby-node to generate the node
          createNodeId, // helper function in gatsby-node to generate the node id
          cache, // Gatsby's cache
          store, // Gatsby's redux store
          ext, // Adds extension of picture,
          name: Date.now(),
        });
        resolve(fileNode);
      })
  );
};

const getDigest = id =>
  crypto
    .createHash('md5')
    .update(id)
    .digest('hex');

exports.createSchemaCustomization = ({ actions }, { types = [] }) => {
  const { createTypes } = actions;
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const { definition } = type;
    if (definition) createTypes(definition);
  }
};

exports.sourceNodes = async (
  { boundActionCreators, createNodeId, store, cache },
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
        const { collection = '', type = '', map = node => node } = entry;
        const snapshot = await db.collection(collection).get();
        const { docs = [] } = snapshot;

        if (docs.length > 0) {
          for (let doc of snapshot.docs) {
            const contentDigest = getDigest(doc.id);
            const values = { ...doc.data() };

            await replaceImageUrlsWithFile(values, {
              createNode,
              store,
              cache,
              createNodeId,
            });

            console.log(JSON.stringify(values, null, 2));

            console.log('\n Creating final node... \n');

            createNode(
              Object.assign(
                {
                  id: doc.id,
                  parent: null,
                  children: [],
                  internal: {
                    type,
                    contentDigest,
                  },
                },
                map(values)
              )
            );
          }
        } else {
          createNode(
            Object.assign({
              id: '0',
              parent: null,
              children: [],
              values: {},
              internal: {
                type,
                contentDigest: getDigest(`test-${collection}-${Date.now()}`),
              },
            })
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
