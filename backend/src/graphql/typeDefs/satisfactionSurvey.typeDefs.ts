import gql from "graphql-tag";

export default gql`
  type SatisfactionSurveyRating {
    key: String!
    label: String!
    category: String!
    score: Int!
  }

  type SatisfactionSurveyTemplateQuestion {
    key: String!
    label: String!
    category: String!
    order: Int!
    active: Boolean!
  }

  type SatisfactionSurveyTemplateVersion {
    version: Int!
    title: String!
    description: String
    questions: [SatisfactionSurveyTemplateQuestion!]!
    validFrom: Date!
    validTo: Date
    updatedBy: User
  }

  type SatisfactionSurveyTemplate {
    _id: ID!
    title: String!
    description: String
    active: Boolean!
    currentVersion: Int!
    questions: [SatisfactionSurveyTemplateQuestion!]!
    versions: [SatisfactionSurveyTemplateVersion!]!
    updatedBy: User
    archivedAt: Date
    archivedBy: User
    createdAt: Date
    updatedAt: Date
  }

  type RemoveSatisfactionSurveyTemplatePayload {
    action: String!
    deleted: Boolean!
    archived: Boolean!
    responseCount: Int!
    template: SatisfactionSurveyTemplate
  }

  type SatisfactionSurveyRequirement {
    required: Boolean!
    threshold: Int!
    completedServiceCount: Int!
    hasSubmittedCurrentVersion: Boolean!
    currentVersion: Int!
  }

  type SatisfactionSurvey {
    _id: ID!
    templateId: SatisfactionSurveyTemplate
    templateVersion: Int
    userId: User!
    patientId: Patient
    occupation: String!
    studentHousing: String
    hasVisited: Boolean!
    visitFrequency: String
    servicesReceived: [String!]!
    wouldReturn: Boolean!
    wouldReturnReason: String
    improvementSuggestion: String
    ratings: [SatisfactionSurveyRating!]!
    overallRating: Int
    createdAt: Date
    updatedAt: Date
  }

  input SatisfactionSurveyRatingInput {
    key: String!
    label: String!
    category: String!
    score: Int!
  }

  input SatisfactionSurveyTemplateQuestionInput {
    key: String
    label: String!
    category: String!
    order: Int!
    active: Boolean!
  }

  input UpdateSatisfactionSurveyTemplateInput {
    title: String!
    description: String
    questions: [SatisfactionSurveyTemplateQuestionInput!]!
  }

  input SubmitSatisfactionSurveyInput {
    occupation: String!
    studentHousing: String
    hasVisited: Boolean!
    visitFrequency: String
    servicesReceived: [String!]!
    wouldReturn: Boolean!
    wouldReturnReason: String
    improvementSuggestion: String
    ratings: [SatisfactionSurveyRatingInput!]!
    overallRating: Int
  }
`;
