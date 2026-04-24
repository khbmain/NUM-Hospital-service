import gql from "graphql-tag";

export default gql`
  type IcdEntity {
    id: String
    uri: String!
    code: String
    title: String!
    definition: String
    classKind: String
    foundationUri: String
    browserUrl: String
    hasChildren: Boolean!
    childUris: [String!]!
  }
`;
