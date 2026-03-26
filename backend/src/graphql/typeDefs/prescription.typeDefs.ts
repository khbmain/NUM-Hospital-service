import gql from "graphql-tag";

export default gql`
  type Prescription {
    _id: ID!
    visit: Visit!
    patient: Patient!
    doctor: Staff!
    prescriptionNumber: String!
    items: [PrescriptionItem!]!
    notes: String
    status: String!
    createdAt: String
  }

  type PrescriptionItem {
    medicationName: String!
    dosage: String!
    frequency: String!
    duration: String
    quantity: Int
    unit: String
    instructions: String
  }

  input CreatePrescriptionInput {
    visitId: ID!
    items: [PrescriptionItemInput!]!
    notes: String
  }

  input PrescriptionItemInput {
    medicationName: String!
    dosage: String!
    frequency: String!
    duration: String
    quantity: Int
    unit: String
    instructions: String
    inventoryItemId: ID
  }
`;
