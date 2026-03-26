import gql from "graphql-tag";

export default gql`
  type Notification {
    _id: ID!
    userId: User
    title: String
    body: Json
    type: String
    read: Boolean
    createdAt: String
  }
`;
