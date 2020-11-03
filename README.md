# gatsby-source-firebase-collections

[![npm version](https://badge.fury.io/js/gatsby-source-firebase-collections.svg)](https://badge.fury.io/js/gatsby-source-firebase-collections)

Gatsby source plugin for building websites using
[Firebase Firestore](https://firebase.google.com/products/firestore)
as a data source

## Usage

1. Add `gatsby-source-firebase-collections` as a dependency by running using `npm` or `yarn`:

   ```sh
   npm i gatsby-source-firebase-collections
   # or
   yarn add gatsby-source-firebase-collections
   ```

2. Configure settings at `gatsby-config.js`, for example:

   ```js
   module.exports = {
     plugins: [
       {
         resolve: `gatsby-source-firebase-collections`,
         options: {
           appConfig: {
             apiKey: 'api-key',
             authDomain: 'project-id.firebaseapp.com',
             databaseURL: 'https://project-id.firebaseio.com',
             projectId: 'project-id',
             storageBucket: 'project-id.appspot.com',
             messagingSenderId: 'sender-id',
             appID: 'app-id',
           },
           types: [
             {
               type: `Book`,
               collection: `books`,
               map: doc => ({
                 title: doc.title,
                 isbn: doc.isbn,
                 author___NODE: doc.author.id,
               }),
             },
             {
               type: `Author`,
               collection: `authors`,
               map: doc => ({
                 name: doc.name,
                 country: doc.country,
                 books___NODE: doc.books.map(book => book.id),
               }),
             },
           ],
         },
       },
     ],
   };
   ```

   Note that you will need to have `books` and `authors` in Firestore matching
   this schema before Gatsby can query correctly.

3. Test GraphQL query:

   ```graphql
   {
     allBooks {
       edges {
         node {
           title
           isbn
           author {
             name
           }
         }
       }
     }
   }
   ```

## Configurations

| Key                | Description                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `appConfig`        | Firebase credentials generated on web project configuration.                                                                                 |
| `types`            | Array of types, which require the following keys (`type`, `collection`, `map`)                                                               |
| `types.type`       | The type of the collection, which will be used in GraphQL queries, e.g. when `type = Book`, the GraphQL types are named `book` and `allBook` |
| `types.collection` | The name of the collections in Firestore. **Nested collections are not tested**                                                              |
| `types.map`        | A function to map your data in Firestore to Gatsby nodes, utilize the undocumented `___NODE` to link between nodes                           |

## Disclaimer

This project is created solely to suit our requirements, no maintenance or
warranty are provided. Feel free to send in pull requests.

## Acknowledgement

- [ryanflorence/gatsby-source-firebase](https://github.com/ryanflorence/gatsby-source-firebase)
