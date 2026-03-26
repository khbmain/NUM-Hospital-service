import gql from "graphql-tag";

export default gql`
  type Appointment {
    _id: ID!
    patient: Patient!
    doctor: Staff!
    department: Department
    scheduledDate: Date!
    scheduledTime: String!
    duration: Int
    type: String!
    status: String!
    queueNumber: Int
    chiefComplaint: String
    notes: String
    checkedInAt: Date
    checkedInBy: User
    cancelReason: String
    createdBy: User
    createdAt: String
  }

  type AppointmentList {
    appointments: [Appointment!]!
    total: Int!
  }

  input CreateAppointmentInput {
    patientId: ID!
    doctorId: ID!
    departmentId: ID
    scheduledDate: Date!
    scheduledTime: String!
    duration: Int
    type: String
    chiefComplaint: String
    notes: String
  }

  input AppointmentFilterInput {
    doctorId: ID
    patientId: ID
    departmentId: ID
    status: String
    dateFrom: Date
    dateTo: Date
    page: Int
    limit: Int
  }
`;
