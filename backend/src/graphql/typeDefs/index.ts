import gql from "graphql-tag";
import authTypeDefs from "./auth.typeDefs";
import userTypeDefs from "./user.typeDefs";
import patientTypeDefs from "./patient.typeDefs";
import staffTypeDefs from "./staff.typeDefs";
import appointmentTypeDefs from "./appointment.typeDefs";
import visitTypeDefs from "./visit.typeDefs";
import diagnosisTypeDefs from "./diagnosis.typeDefs";
import prescriptionTypeDefs from "./prescription.typeDefs";
import notificationTypeDefs from "./notification.typeDefs";

// Root types — all domain queries/mutations/subscriptions are defined here
const rootTypeDefs = gql`
  scalar Upload
  scalar Json
  scalar Date

  type Query {
    # ─── Auth ───
    me: User

    # ─── Users ───
    getUser(_id: ID!): User
    listUsers(role: String!): [User!]!

    # ─── Patients ───
    searchPatients(query: String!, page: Int, limit: Int): PatientList!
    getPatient(_id: ID!): Patient
    getPatientByRegistration(registrationNumber: String!): Patient
    getMyPatientProfile: Patient

    # ─── Staff ───
    listStaff(staffType: String, departmentId: ID): [Staff!]!
    getStaff(_id: ID!): Staff
    getDoctors(departmentId: ID): [Staff!]!
    listDepartments: [Department!]!

    # ─── Appointments ───
    getAppointment(_id: ID!): Appointment
    listAppointments(filter: AppointmentFilterInput!): AppointmentList!
    getMyAppointments(status: String, page: Int, limit: Int): AppointmentList!
    getDoctorQueue(doctorId: ID!, date: Date!): [Appointment!]!
    getAvailableSlots(doctorId: ID!, date: Date!): [String!]!

    # ─── Visits ───
    getVisit(_id: ID!): Visit
    listVisitsByPatient(patientId: ID!, page: Int, limit: Int): [Visit!]!
    getMyVisitHistory(page: Int, limit: Int): [Visit!]!
    getTodayVisits(doctorId: ID): [Visit!]!

    # ─── Diagnoses ───
    getDiagnosesByVisit(visitId: ID!): [Diagnosis!]!
    getDiagnosesByPatient(patientId: ID!): [Diagnosis!]!
    getMyDiagnoses(page: Int, limit: Int): [Diagnosis!]!

    # ─── Prescriptions ───
    getPrescription(_id: ID!): Prescription
    getPrescriptionsByVisit(visitId: ID!): [Prescription!]!
    getPrescriptionsByPatient(patientId: ID!): [Prescription!]!
    getMyPrescriptions(page: Int, limit: Int): [Prescription!]!

    # ─── Notifications ───
    getMyNotifications(page: Int, limit: Int): [Notification!]!
  }

  type Mutation {
    # ─── Auth ───
    loginUser(phone: String!, password: String!): AuthPayload!
    sendEmailLoginOTP(email: String!): String!
    loginWithEmailOTP(email: String!, code: String!): AuthPayload!
    registerUser(input: RegisterUserInput!): User!
    changePassword(password: String!, newPassword: String!): String!
    forgotPassword(phone: String!): String!
    verifyOTP(input: OTPInput!): String!
    initiateOAuth(provider: String!, origin: String): OAuthInitPayload!
    updateMe(input: UpdateProfileInput!): User!

    # ─── Patients ───
    createPatient(input: CreatePatientInput!): Patient!
    updatePatient(_id: ID!, input: UpdatePatientInput!): Patient!

    # ─── Staff ───
    createStaff(input: CreateStaffInput!): Staff!
    updateStaff(_id: ID!, input: UpdateStaffInput!): Staff!
    createDepartment(input: CreateDepartmentInput!): Department!
    updateDepartment(_id: ID!, input: UpdateDepartmentInput!): Department!

    # ─── Appointments ───
    createAppointment(input: CreateAppointmentInput!): Appointment!
    checkInAppointment(_id: ID!): Appointment!
    cancelAppointment(_id: ID!, reason: String): Appointment!
    startAppointment(_id: ID!): Appointment!
    completeAppointment(_id: ID!): Appointment!
    markNoShow(_id: ID!): Appointment!

    # ─── Visits ───
    createVisit(input: CreateVisitInput!): Visit!
    updateVisit(_id: ID!, input: UpdateVisitInput!): Visit!
    completeVisit(_id: ID!): Visit!
    recordVitalSigns(visitId: ID!, input: VitalSignInput!): VitalSign!

    # ─── Diagnoses ───
    createDiagnosis(input: CreateDiagnosisInput!): Diagnosis!
    updateDiagnosis(_id: ID!, input: UpdateDiagnosisInput!): Diagnosis!
    deleteDiagnosis(_id: ID!): Boolean!

    # ─── Prescriptions ───
    createPrescription(input: CreatePrescriptionInput!): Prescription!
    updatePrescriptionStatus(_id: ID!, status: String!): Prescription!

    # ─── Notifications ───
    readNotifications(ids: [ID!]!): [Notification!]!
  }

  type Subscription {
    notification: Json
  }
`;

export default [
  rootTypeDefs,
  authTypeDefs,
  userTypeDefs,
  patientTypeDefs,
  staffTypeDefs,
  appointmentTypeDefs,
  visitTypeDefs,
  diagnosisTypeDefs,
  prescriptionTypeDefs,
  notificationTypeDefs,
];
