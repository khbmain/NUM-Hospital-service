import gql from "graphql-tag";

export default gql`
  type Staff {
    _id: ID!
    userId: User!
    department: Department
    staffType: String!
    specialization: String
    licenseNumber: String
    title: String
    bio: String
    isAvailable: Boolean
    maxDailyAppointments: Int
    status: String
    createdAt: String
  }

  type Department {
    _id: ID!
    name: String!
    code: String!
    description: String
    isActive: Boolean
  }

  input CreateStaffInput {
    userId: ID!
    departmentId: ID
    staffType: String!
    specialization: String
    licenseNumber: String
    title: String
    maxDailyAppointments: Int
  }

  input UpdateStaffInput {
    departmentId: ID
    specialization: String
    licenseNumber: String
    title: String
    bio: String
    isAvailable: Boolean
    maxDailyAppointments: Int
    status: String
  }

  input CreateDepartmentInput {
    name: String!
    code: String!
    description: String
  }

  input UpdateDepartmentInput {
    name: String
    description: String
    isActive: Boolean
  }
`;
