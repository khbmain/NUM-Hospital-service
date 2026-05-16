import gql from "graphql-tag";

export default gql`
  type Patient {
    _id: ID!
    userId: User
    registrationNumber: String!
    firstname: String!
    lastname: String!
    phone: String
    email: String
    gender: String
    birthdate: Date
    nationalId: String
    sisiId: String
    category: String
    universityId: String
    bloodType: String
    allergies: [String]
    chronicConditions: [String]
    regularMedications: [String]
    medicalWarnings: [String]
    emergencyContact: EmergencyContact
    address: String
    notes: String
    profileCompletedAt: Date
    status: String
    registeredBy: User
    createdAt: String
    updatedAt: String
  }

  type EmergencyContact {
    name: String
    phone: String
    relationship: String
  }

  type PatientList {
    patients: [Patient!]!
    total: Int!
    page: Int!
    limit: Int!
  }

  input CreatePatientInput {
    registrationNumber: String
    firstname: String!
    lastname: String!
    phone: String
    email: String
    gender: String
    birthdate: Date
    nationalId: String
    sisiId: String
    category: String!
    universityId: String
    bloodType: String
    allergies: [String]
    chronicConditions: [String]
    regularMedications: [String]
    medicalWarnings: [String]
    emergencyContact: EmergencyContactInput
    address: String
    notes: String
  }

  input UpdatePatientInput {
    firstname: String
    lastname: String
    phone: String
    email: String
    gender: String
    birthdate: Date
    category: String
    bloodType: String
    allergies: [String]
    chronicConditions: [String]
    regularMedications: [String]
    medicalWarnings: [String]
    emergencyContact: EmergencyContactInput
    address: String
    notes: String
  }

  input PatientProfileInput {
    registrationNumber: String!
    firstname: String!
    lastname: String!
    phone: String!
    email: String
    gender: String!
    birthdate: Date!
    nationalId: String
    category: String
    universityId: String
    bloodType: String
    allergies: [String]
    chronicConditions: [String]
    regularMedications: [String]
    medicalWarnings: [String]
    emergencyContact: EmergencyContactInput
    address: String
    notes: String
  }

  input EmergencyContactInput {
    name: String
    phone: String
    relationship: String
  }
`;
