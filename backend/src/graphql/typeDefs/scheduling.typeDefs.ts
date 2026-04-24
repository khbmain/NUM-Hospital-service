import gql from "graphql-tag";

export default gql`
  type Service {
    _id: ID!
    name: String!
    code: String!
    category: String!
    description: String
    defaultDurationMinutes: Int
    defaultBufferMinutes: Int
    requiresDoctor: Boolean
    requiresNurse: Boolean
    requiresDevice: Boolean
    assignedStaffs: [Staff!]
    isActive: Boolean
    createdAt: String
  }

  type Resource {
    _id: ID!
    name: String!
    type: String!
    category: String
    staff: Staff
    services: [Service!]
    room: String
    capacity: Int
    slotIntervalMinutes: Int
    defaultDurationMinutes: Int
    defaultBufferMinutes: Int
    workSchedule: [WorkSchedule!]
    isActive: Boolean
    notes: String
  }

  type WorkSchedule {
    dayOfWeek: Int
    startTime: String
    endTime: String
  }

  type TimeSlot {
    time: String!
    available: Boolean!
    status: String!
    reason: String
    remaining: Int!
    capacity: Int!
    startsAt: Date
    endsAt: Date
  }

  type UnavailableBlock {
    _id: ID!
    service: Service
    resource: Resource
    staff: Staff
    startAt: Date!
    endAt: Date!
    reason: String!
    note: String
    status: String
    cancelledAt: Date
    cancelledBy: User
    cancelledAppointments: [Appointment!]
    createdBy: User
    createdAt: String
  }

  input WorkScheduleInput {
    dayOfWeek: Int
    startTime: String
    endTime: String
  }

  input CreateServiceInput {
    name: String!
    code: String!
    category: String!
    description: String
    defaultDurationMinutes: Int
    defaultBufferMinutes: Int
    requiresDoctor: Boolean
    requiresNurse: Boolean
    requiresDevice: Boolean
    assignedStaffIds: [ID!]
    isActive: Boolean
  }

  input UpdateServiceInput {
    name: String
    category: String
    description: String
    defaultDurationMinutes: Int
    defaultBufferMinutes: Int
    requiresDoctor: Boolean
    requiresNurse: Boolean
    requiresDevice: Boolean
    assignedStaffIds: [ID!]
    isActive: Boolean
  }

  input CreateResourceInput {
    name: String!
    type: String!
    category: String
    staffId: ID
    serviceIds: [ID!]
    room: String
    capacity: Int
    slotIntervalMinutes: Int
    defaultDurationMinutes: Int
    defaultBufferMinutes: Int
    workSchedule: [WorkScheduleInput!]
    isActive: Boolean
    notes: String
  }

  input UpdateResourceInput {
    name: String
    type: String
    category: String
    staffId: ID
    serviceIds: [ID!]
    room: String
    capacity: Int
    slotIntervalMinutes: Int
    defaultDurationMinutes: Int
    defaultBufferMinutes: Int
    workSchedule: [WorkScheduleInput!]
    isActive: Boolean
    notes: String
  }

  input CreateUnavailableBlockInput {
    serviceId: ID
    resourceId: ID
    staffId: ID
    startAt: Date!
    endAt: Date!
    reason: String!
    note: String
  }

  input UpdateUnavailableBlockInput {
    startAt: Date
    endAt: Date
    reason: String
    note: String
  }
`;
