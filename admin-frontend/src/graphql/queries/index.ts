import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me { me { _id firstname lastname email phone role gender profilePic status } }
`;

export const SEARCH_PATIENTS = gql`
  query SearchPatients($query: String!, $page: Int, $limit: Int) {
    searchPatients(query: $query, page: $page, limit: $limit) {
      patients { _id registrationNumber firstname lastname phone email gender birthdate category status createdAt }
      total page limit
    }
  }
`;

export const GET_PATIENT = gql`
  query GetPatient($id: ID!) {
    getPatient(_id: $id) {
      _id registrationNumber firstname lastname phone email gender birthdate category
      universityId bloodType allergies emergencyContact { name phone relationship }
      address notes status createdAt
    }
  }
`;

export const LIST_APPOINTMENTS = gql`
  query ListAppointments($filter: AppointmentFilterInput!) {
    listAppointments(filter: $filter) {
      appointments {
        _id scheduledDate scheduledTime scheduledStart scheduledEnd type status queueNumber chiefComplaint appointmentKind cancelReason
        service { _id name category }
        resource { _id name type capacity }
        patient { _id registrationNumber firstname lastname phone }
        doctor { _id userId { firstname lastname } specialization department { name } }
        assignedStaff { _id userId { firstname lastname } specialization }
        createdAt
      }
      total
    }
  }
`;

export const DOCTOR_QUEUE = gql`
  query DoctorQueue($doctorId: ID!, $date: Date!) {
    getDoctorQueue(doctorId: $doctorId, date: $date) {
      _id scheduledDate scheduledTime type status queueNumber chiefComplaint
      patient { _id registrationNumber firstname lastname phone birthdate gender }
    }
  }
`;

export const GET_VISIT = gql`
  query GetVisit($id: ID!) {
    getVisit(_id: $id) {
      _id visitDate status chiefComplaint historyOfPresentIllness physicalExamination
      assessment plan notes completedAt
      patient { _id registrationNumber firstname lastname phone birthdate gender bloodType allergies }
      doctor { _id userId { firstname lastname } specialization }
      vitalSigns { temperature bloodPressureSystolic bloodPressureDiastolic heartRate respiratoryRate oxygenSaturation weight height }
      diagnoses { _id name icdCode icdTitle icdVersion icdLinearizationUri icdFoundationUri type severity notes createdAt }
      prescriptions { _id prescriptionNumber items { medicationName dosage frequency duration quantity unit instructions } notes status createdAt }
    }
  }
`;

export const VISITS_BY_PATIENT = gql`
  query VisitsByPatient($patientId: ID!, $page: Int, $limit: Int) {
    listVisitsByPatient(patientId: $patientId, page: $page, limit: $limit) {
      _id visitDate status chiefComplaint assessment
      doctor { userId { firstname lastname } specialization }
      diagnoses { _id name type }
      completedAt
    }
  }
`;

export const TODAY_VISITS = gql`
  query TodayVisits($doctorId: ID) {
    getTodayVisits(doctorId: $doctorId) {
      _id visitDate status chiefComplaint
      patient { _id registrationNumber firstname lastname }
    }
  }
`;

export const GET_DOCTORS = gql`
  query GetDoctors($departmentId: ID) {
    getDoctors(departmentId: $departmentId) {
      _id userId { _id firstname lastname } specialization department { _id name } isAvailable
    }
  }
`;

export const LIST_DEPARTMENTS = gql`
  query ListDepartments { listDepartments { _id name code description isActive } }
`;

export const LIST_STAFF = gql`
  query ListStaff($staffType: String, $departmentId: ID) {
    listStaff(staffType: $staffType, departmentId: $departmentId) {
      _id userId { _id firstname lastname phone email role status }
      department { _id name } staffType specialization licenseNumber title isAvailable status createdAt
    }
  }
`;

export const PRESCRIPTIONS_BY_PATIENT = gql`
  query PrescriptionsByPatient($patientId: ID!) {
    getPrescriptionsByPatient(patientId: $patientId) {
      _id prescriptionNumber items { medicationName dosage frequency duration quantity unit } notes status createdAt
      doctor { userId { firstname lastname } }
    }
  }
`;

export const DIAGNOSES_BY_VISIT = gql`
  query DiagnosesByVisit($visitId: ID!) {
    getDiagnosesByVisit(visitId: $visitId) { _id name icdCode icdTitle type severity notes createdAt }
  }
`;

export const GET_APPOINTMENT = gql`
  query GetAppointment($id: ID!) {
    getAppointment(_id: $id) {
      _id
      scheduledDate
      scheduledTime
      scheduledStart
      scheduledEnd
      appointmentKind
      type
      status
      queueNumber
      chiefComplaint
      notes
      cancelReason
      createdAt
      patient { _id registrationNumber firstname lastname phone }
      service { _id name category }
      resource { _id name type room capacity }
      doctor {
        _id
        userId { firstname lastname }
        specialization
        department { name }
      }
      assignedStaff {
        _id
        userId { firstname lastname }
        specialization
        department { name }
      }
    }
  }
`;

export const ICD_ROOT_CHAPTERS = gql`
  query IcdRootChapters($language: String) {
    icd11RootChapters(language: $language) {
      id uri code title hasChildren classKind foundationUri browserUrl
    }
  }
`;

export const ICD_CHILDREN = gql`
  query IcdChildren($uri: String!, $language: String) {
    icd11Children(uri: $uri, language: $language) {
      id uri code title hasChildren classKind foundationUri browserUrl
    }
  }
`;

export const ICD_SEARCH = gql`
  query IcdSearch($q: String!, $language: String) {
    icd11Search(q: $q, language: $language) {
      id uri code title hasChildren classKind foundationUri browserUrl
    }
  }
`;

export const MONTHLY_REPORT = gql`
  query MonthlyReport($month: String!) {
    monthlyReport(month: $month) {
      month
      completedAppointments
      completedVisits
      byAgeGroup { label count }
      byGender { label count }
      byService { label count }
      byResource { label count }
      byDoctor { label count }
    }
  }
`;

export const LIST_SERVICES = gql`
  query ListServices($category: String) {
    listServices(category: $category) {
      _id
      name
      code
      category
      description
      defaultDurationMinutes
      defaultBufferMinutes
      requiresDoctor
      requiresNurse
      requiresDevice
      assignedStaffs {
        _id
        staffType
        userId { _id firstname lastname }
      }
      isActive
      createdAt
    }
  }
`;

export const LIST_RESOURCES = gql`
  query ListResources($serviceId: ID, $type: String) {
    listResources(serviceId: $serviceId, type: $type) {
      _id
      name
      type
      category
      room
      capacity
      services { _id name }
      staff { _id userId { firstname lastname } specialization }
    }
  }
`;

export const LIST_UNAVAILABLE_BLOCKS = gql`
  query ListUnavailableBlocks($dateFrom: Date, $dateTo: Date, $resourceId: ID, $staffId: ID) {
    listUnavailableBlocks(dateFrom: $dateFrom, dateTo: $dateTo, resourceId: $resourceId, staffId: $staffId) {
      _id
      startAt
      endAt
      reason
      note
      status
      cancelledAt
      resource { _id name type }
      staff { _id userId { firstname lastname } specialization }
      cancelledAppointments { _id scheduledTime patient { firstname lastname email } }
      createdAt
    }
  }
`;
