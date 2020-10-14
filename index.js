const graphqlDefaults = require('graphql-defaults');
const { genTypesDefinitionsMaps } = graphqlDefaults;

// no-op-lo-op
genTypesDefinitionsMaps(`
    type SustainabilityPageContent {
        title: String
    }
`);
