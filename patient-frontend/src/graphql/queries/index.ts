import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      _id
      firstname
      lastname
      email
      phone
      role
      gender
      profilePic
      status
    }
  }
`;

export const MY_PATIENT_PROFILE = gql`
  query MyPatientProfile {
    getMyPatientProfile {
      _id
      registrationNumber
      firstname
      lastname
      phone
      email
      gender
      birthdate
      category
      bloodType
      allergies
      chronicConditions
      regularMedications
      medicalWarnings
      emergencyContact { name phone relationship }
      address
      notes
      status
      profileCompletedAt
    }
  }
`;

export const MY_SATISFACTION_SURVEY = gql`
  query MySatisfactionSurvey {
    getMySatisfactionSurvey {
      _id
      occupation
      createdAt
      overallRating
    }
  }
`;

export const ACTIVE_SATISFACTION_SURVEY_TEMPLATE = gql`
  query ActiveSatisfactionSurveyTemplate {
    getActiveSatisfactionSurveyTemplate {
      _id
      title
      description
      currentVersion
      questions {
        key
        label
        category
        order
        active
      }
    }
  }
`;

export const MY_SATISFACTION_SURVEY_REQUIREMENT = gql`
  query MySatisfactionSurveyRequirement {
    getMySatisfactionSurveyRequirement {
      required
      threshold
      completedServiceCount
      hasSubmittedCurrentVersion
      currentVersion
    }
  }
`;

export const MY_APPOINTMENTS = gql`
  query MyAppointments($status: String, $page: Int, $limit: Int) {
    getMyAppointments(status: $status, page: $page, limit: $limit) {
      appointments {
        _id
        scheduledDate
        scheduledTime
        type
        status
        queueNumber
        chiefComplaint
        cancelReason
        service { _id name category }
        resource { _id name type capacity }
        assignedStaff {
          _id
          userId { firstname lastname }
          specialization
          department { name }
        }
        doctor {
          _id
          userId { firstname lastname }
          specialization
          department { name }
        }
        createdAt
      }
      total
    }
  }
`;

export const AVAILABLE_SLOTS = gql`
  query AvailableSlots($doctorId: ID, $serviceId: ID, $resourceId: ID, $date: Date!) {
    getAvailableSlots(doctorId: $doctorId, serviceId: $serviceId, resourceId: $resourceId, date: $date) {
      time
      available
      status
      reason
      remaining
      capacity
      startsAt
      endsAt
    }
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
      createdAt
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
        userId { firstname lastname }
        specialization
        department { _id name }
        isAvailable
      }
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
      notes
      defaultDurationMinutes
      defaultBufferMinutes
      services { _id name }
      staff { _id userId { firstname lastname } specialization }
    }
  }
`;

export const GET_DOCTORS = gql`
  query GetDoctors($departmentId: ID) {
    getDoctors(departmentId: $departmentId) {
      _id
      userId { firstname lastname }
      specialization
      department { _id name }
      isAvailable
    }
  }
`;

export const LIST_DEPARTMENTS = gql`
  query ListDepartments {
    listDepartments {
      _id
      name
      code
      description
    }
  }
`;

export const MY_VISITS = gql`
  query MyVisitHistory($page: Int, $limit: Int) {
    getMyVisitHistory(page: $page, limit: $limit) {
      _id
      visitDate
      status
      chiefComplaint
      assessment
      doctor {
        userId { firstname lastname }
        specialization
        department { name }
      }
      diagnoses { _id name type severity }
      completedAt
    }
  }
`;

export const MY_VISIT_BY_APPOINTMENT = gql`
  query MyVisitByAppointment($appointmentId: ID!) {
    getMyVisitByAppointment(appointmentId: $appointmentId) {
      _id
      visitDate
      status
      chiefComplaint
      historyOfPresentIllness
      physicalExamination
      assessment
      plan
      notes
      doctor {
        userId { firstname lastname }
        specialization
        department { name }
      }
      diagnoses { _id name icdCode type severity notes }
      prescriptions {
        _id
        prescriptionNumber
        items { medicationName dosage frequency duration quantity unit instructions }
        notes
        status
      }
      completedAt
    }
  }
`;

export const GET_VISIT = gql`
  query GetVisit($id: ID!) {
    getVisit(_id: $id) {
      _id
      visitDate
      status
      chiefComplaint
      historyOfPresentIllness
      physicalExamination
      assessment
      plan
      notes
      doctor {
        userId { firstname lastname }
        specialization
        department { name }
      }
      vitalSigns {
        temperature
        bloodPressureSystolic
        bloodPressureDiastolic
        heartRate
        respiratoryRate
        oxygenSaturation
        weight
        height
      }
      diagnoses { _id name icdCode type severity notes }
      prescriptions {
        _id
        prescriptionNumber
        items { medicationName dosage frequency duration quantity unit instructions }
        notes
        status
      }
      completedAt
    }
  }
`;

export const MY_PRESCRIPTIONS = gql`
  query MyPrescriptions($page: Int, $limit: Int) {
    getMyPrescriptions(page: $page, limit: $limit) {
      _id
      prescriptionNumber
      items { medicationName dosage frequency duration quantity unit }
      notes
      status
      doctor { userId { firstname lastname } specialization }
      createdAt
    }
  }
`;
