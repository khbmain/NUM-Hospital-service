import gql from "graphql-tag";

export default gql`
  type ReportRow {
    label: String!
    count: Int!
  }

  type MonthlyReport {
    month: String!
    completedAppointments: Int!
    completedVisits: Int!
    byAgeGroup: [ReportRow!]!
    byGender: [ReportRow!]!
    byService: [ReportRow!]!
    byResource: [ReportRow!]!
    byDoctor: [ReportRow!]!
  }
`;
