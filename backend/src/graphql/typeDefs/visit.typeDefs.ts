import gql from "graphql-tag";

export default gql`
  type Visit {
    _id: ID!
    appointment: Appointment
    patient: Patient!
    doctor: Staff!
    visitDate: Date!
    visitType: String
    status: String!
    chiefComplaint: String
    historyOfPresentIllness: String
    pastMedicalHistory: String
    familyHistory: String
    socialHistory: String
    currentMedications: String
    allergyNotes: String
    reviewOfSystems: String
    physicalExamination: String
    assessment: String
    plan: String
    doctorAdvice: String
    followUpDate: Date
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
    painScore: Int
    bloodGlucose: Float
    bmi: Float
    recordedBy: User
    createdAt: String
  }

  input CreateVisitInput {
    appointmentId: ID
    patientId: ID!
    doctorId: ID
    visitType: String
    chiefComplaint: String
  }

  input UpdateVisitInput {
    chiefComplaint: String
    historyOfPresentIllness: String
    pastMedicalHistory: String
    familyHistory: String
    socialHistory: String
    currentMedications: String
    allergyNotes: String
    reviewOfSystems: String
    physicalExamination: String
    assessment: String
    plan: String
    doctorAdvice: String
    followUpDate: Date
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
    painScore: Int
    bloodGlucose: Float
  }
`;
