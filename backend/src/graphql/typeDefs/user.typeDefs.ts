import gql from "graphql-tag";

export default gql`
  type User {
    _id: ID!
    email: String
    phone: String
    firstname: String
    lastname: String
    role: String!
    gender: String
    birthdate: Date
    profilePic: String
    status: String
    lastLoginAt: Date
    createdAt: String
    updatedAt: String
  }
`;
