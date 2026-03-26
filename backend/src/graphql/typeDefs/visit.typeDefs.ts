import gql from "graphql-tag";

export default gql`
  type Visit {
    _id: ID!
    appointment: Appointment
    patient: Patient!
    doctor: Staff!
    visitDate: Date!
    status: String!
    chiefComplaint: String
    historyOfPresentIllness: String
    physicalExamination: String
    assessment: String
    plan: String
    notes: String
    vitalSigns: VitalSign
    diagnoses: [Diagnosis!]
    prescriptions: [Prescription!]
    completedAt: Date
    createdAt: String
  }

  type VitalSign {
    _id: ID!
    temperature: Float
    bloodPressureSystolic: Int
    bloodPressureDiastolic: Int
    heartRate: Int
    respiratoryRate: Int
    oxygenSaturation: Float
    weight: Float
    height: Float
    recordedBy: User
    createdAt: String
  }

  input CreateVisitInput {
    appointmentId: ID
    patientId: ID!
    chiefComplaint: String
  }

  input UpdateVisitInput {
    chiefComplaint: String
    historyOfPresentIllness: String
    physicalExamination: String
    assessment: String
    plan: String
    notes: String
  }

  input VitalSignInput {
    temperature: Float
    bloodPressureSystolic: Int
    bloodPressureDiastolic: Int
    heartRate: Int
    respiratoryRate: Int
    oxygenSaturation: Float
    weight: Float
    height: Float
  }
`;
