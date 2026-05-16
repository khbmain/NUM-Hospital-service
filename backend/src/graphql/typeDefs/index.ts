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
import schedulingTypeDefs from "./scheduling.typeDefs";
import icdTypeDefs from "./icd.typeDefs";
import reportTypeDefs from "./report.typeDefs";
import satisfactionSurveyTypeDefs from "./satisfactionSurvey.typeDefs";

const rootTypeDefs = gql`
  scalar Upload
  scalar Json
  scalar Date

  type Query {
    me: User
    listAuditLogs(filter: AuditLogFilterInput): AuditLogList!

    getUser(_id: ID!): User
    listUsers(role: String!): [User!]!

    searchPatients(query: String!, page: Int, limit: Int): PatientList!
    getPatient(_id: ID!): Patient
    getPatientByRegistration(registrationNumber: String!): Patient
    getMyPatientProfile: Patient

    listStaff(staffType: String, departmentId: ID): [Staff!]!
    getStaff(_id: ID!): Staff
    getDoctors(departmentId: ID): [Staff!]!
    listDepartments: [Department!]!
    listServices(category: String): [Service!]!
    listResources(serviceId: ID, type: String): [Resource!]!
    listUnavailableBlocks(dateFrom: Date, dateTo: Date, resourceId: ID, staffId: ID): [UnavailableBlock!]!

    getAppointment(_id: ID!): Appointment
    listAppointments(filter: AppointmentFilterInput!): AppointmentList!
    getMyAppointments(status: String, page: Int, limit: Int): AppointmentList!
    getDoctorQueue(doctorId: ID!, date: Date!): [Appointment!]!
    getAvailableSlots(doctorId: ID, serviceId: ID, resourceId: ID, date: Date!): [TimeSlot!]!

    getVisit(_id: ID!): Visit
    listVisitsByPatient(patientId: ID!, page: Int, limit: Int): [Visit!]!
    getMyVisitHistory(page: Int, limit: Int): [Visit!]!
    getMyVisitByAppointment(appointmentId: ID!): Visit
    getTodayVisits(doctorId: ID): [Visit!]!

    getDiagnosesByVisit(visitId: ID!): [Diagnosis!]!
    getDiagnosesByPatient(patientId: ID!): [Diagnosis!]!
    getMyDiagnoses(page: Int, limit: Int): [Diagnosis!]!

    getPrescription(_id: ID!): Prescription
    getPrescriptionsByVisit(visitId: ID!): [Prescription!]!
    getPrescriptionsByPatient(patientId: ID!): [Prescription!]!
    getMyPrescriptions(page: Int, limit: Int): [Prescription!]!

    getMyNotifications(page: Int, limit: Int): [Notification!]!

    icd11RootChapters(language: String): [IcdEntity!]!
    icd11Children(uri: String!, language: String): [IcdEntity!]!
    icd11Search(q: String!, language: String): [IcdEntity!]!

    monthlyReport(month: String, dateFrom: Date, dateTo: Date): MonthlyReport!
    getActiveSatisfactionSurveyTemplate: SatisfactionSurveyTemplate!
    getMySatisfactionSurvey: SatisfactionSurvey
    getMySatisfactionSurveyRequirement: SatisfactionSurveyRequirement!
    listSatisfactionSurveys: [SatisfactionSurvey!]!
  }

  type Mutation {
    loginUser(phone: String!, password: String!): AuthPayload!
    logoutUser: Boolean!
    sendEmailLoginOTP(email: String!): String!
    loginWithEmailOTP(email: String!, code: String!): AuthPayload!
    registerUser(input: RegisterUserInput!): User!
    changePassword(password: String!, newPassword: String!): String!
    forgotPassword(phone: String!): String!
    verifyOTP(input: OTPInput!): String!
    initiateOAuth(provider: String!, origin: String): OAuthInitPayload!
    updateMe(input: UpdateProfileInput!): User!

    createPatient(input: CreatePatientInput!): Patient!
    updatePatient(_id: ID!, input: UpdatePatientInput!): Patient!
    upsertMyPatientProfile(input: PatientProfileInput!): Patient!

    createStaff(input: CreateStaffInput!): Staff!
    updateStaff(_id: ID!, input: UpdateStaffInput!): Staff!
    createDepartment(input: CreateDepartmentInput!): Department!
    updateDepartment(_id: ID!, input: UpdateDepartmentInput!): Department!
    createService(input: CreateServiceInput!): Service!
    updateService(_id: ID!, input: UpdateServiceInput!): Service!
    createResource(input: CreateResourceInput!): Resource!
    updateResource(_id: ID!, input: UpdateResourceInput!): Resource!
    seedDefaultScheduling: Boolean!
    createUnavailableBlock(input: CreateUnavailableBlockInput!): UnavailableBlock!
    updateUnavailableBlock(_id: ID!, input: UpdateUnavailableBlockInput!): UnavailableBlock!
    cancelUnavailableBlock(_id: ID!): UnavailableBlock!

    createAppointment(input: CreateAppointmentInput!): Appointment!
    checkInAppointment(_id: ID!): Appointment!
    cancelAppointment(_id: ID!, reason: String): Appointment!
    startAppointment(_id: ID!): Appointment!
    completeAppointment(_id: ID!): Appointment!
    markNoShow(_id: ID!): Appointment!

    createVisit(input: CreateVisitInput!): Visit!
    updateVisit(_id: ID!, input: UpdateVisitInput!): Visit!
    completeVisit(_id: ID!): Visit!
    recordVitalSigns(visitId: ID!, input: VitalSignInput!): VitalSign!

    createDiagnosis(input: CreateDiagnosisInput!): Diagnosis!
    updateDiagnosis(_id: ID!, input: UpdateDiagnosisInput!): Diagnosis!
    deleteDiagnosis(_id: ID!): Boolean!

    createPrescription(input: CreatePrescriptionInput!): Prescription!
    updatePrescriptionStatus(_id: ID!, status: String!): Prescription!

    readNotifications(ids: [ID!]!): [Notification!]!
    submitSatisfactionSurvey(input: SubmitSatisfactionSurveyInput!): SatisfactionSurvey!
    updateSatisfactionSurveyTemplate(input: UpdateSatisfactionSurveyTemplateInput!): SatisfactionSurveyTemplate!
    removeSatisfactionSurveyTemplate: RemoveSatisfactionSurveyTemplatePayload!
  }

  type Subscription {
    notification: Json
  }

  type AuditLog {
    _id: ID!
    user: User
    action: String!
    resource: String!
    resourceId: String
    details: Json
    ipAddress: String
    userAgent: String
    createdAt: Date
  }

  type AuditLogList {
    logs: [AuditLog!]!
    total: Int!
    page: Int!
    limit: Int!
  }

  input AuditLogFilterInput {
    action: String
    resource: String
    userId: ID
    page: Int
    limit: Int
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
  schedulingTypeDefs,
  icdTypeDefs,
  reportTypeDefs,
  satisfactionSurveyTypeDefs,
];
