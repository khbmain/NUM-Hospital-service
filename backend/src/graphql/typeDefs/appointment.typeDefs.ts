import gql from "graphql-tag";

export default gql`
  type Appointment {
    _id: ID!
    patient: Patient!
    doctor: Staff
    nurse: Staff
    assignedStaff: Staff
    service: Service
    resource: Resource
    department: Department
    scheduledDate: Date!
    scheduledTime: String!
    scheduledStart: Date
    scheduledEnd: Date
    blockedUntil: Date
    duration: Int
    durationMinutes: Int
    bufferMinutes: Int
    seatNumber: Int
    appointmentKind: String
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
    doctorId: ID
    nurseId: ID
    assignedStaffId: ID
    serviceId: ID
    resourceId: ID
    departmentId: ID
    scheduledDate: Date!
    scheduledTime: String!
    duration: Int
    durationMinutes: Int
    bufferMinutes: Int
    appointmentKind: String
    type: String
    chiefComplaint: String
    notes: String
  }

  input AppointmentFilterInput {
    doctorId: ID
    serviceId: ID
    resourceId: ID
    patientId: ID
    departmentId: ID
    status: String
    dateFrom: Date
    dateTo: Date
    page: Int
    limit: Int
  }
`;
