import gql from "graphql-tag";

export default gql`
  type AuthPayload {
    user: User!
  }

  type OAuthInitPayload {
    redirectUrl: String!
  }

  input RegisterUserInput {
    phone: String!
    password: String
    firstname: String!
    lastname: String!
    email: String
    gender: String
    birthdate: Date
    role: String!
  }

  input UpdateProfileInput {
    firstname: String
    lastname: String
    email: String
    phone: String
    gender: String
    profilePic: Upload
    fcmToken: String
  }

  input OTPInput {
    code: String!
    newPassword: String!
  }
`;
