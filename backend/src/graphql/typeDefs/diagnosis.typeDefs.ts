import gql from "graphql-tag";

export default gql`
  type Diagnosis {
    _id: ID!
    visit: Visit!
    patient: Patient!
    doctor: Staff
    icdCode: String
    icdTitle: String
    icdVersion: String
    icdLinearization: String
    icdLanguage: String
    icdLinearizationUri: String
    icdFoundationUri: String
    icdParentUri: String
    name: String!
    description: String
    type: String!
    severity: String
    notes: String
    createdAt: String
  }

  input CreateDiagnosisInput {
    visitId: ID!
    icdCode: String
    icdTitle: String
    icdVersion: String
    icdLinearization: String
    icdLanguage: String
    icdLinearizationUri: String
    icdFoundationUri: String
    icdParentUri: String
    name: String!
    description: String
    type: String!
    severity: String
    notes: String
  }

  input UpdateDiagnosisInput {
    icdCode: String
    icdTitle: String
    icdVersion: String
    icdLinearization: String
    icdLanguage: String
    icdLinearizationUri: String
    icdFoundationUri: String
    icdParentUri: String
    name: String
    description: String
    type: String
    severity: String
    notes: String
  }
`;
