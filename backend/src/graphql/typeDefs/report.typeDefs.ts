import gql from "graphql-tag";

export default gql`
  type ReportRow {
    label: String!
    count: Int!
  }

  type AgeGenderCell {
    ageGroup: String!
    female: Int!
    male: Int!
  }

  type AgeGenderReportRow {
    label: String!
    cells: [AgeGenderCell!]!
    totalFemale: Int!
    totalMale: Int!
    total: Int!
  }

  type MonthlyReport {
    month: String!
    completedAppointments: Int!
    completedVisits: Int!
    ageGroups: [String!]!
    ageGenderRows: [AgeGenderReportRow!]!
    byAgeGroup: [ReportRow!]!
    byGender: [ReportRow!]!
    byService: [ReportRow!]!
    byResource: [ReportRow!]!
    byDoctor: [ReportRow!]!
  }
`;
