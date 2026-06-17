import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword as fbSignIn,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  createUserWithEmailAndPassword as fbCreateUser,
} from "firebase/auth";
import {
  getFirestore,
  doc as fbDoc,
  getDoc as fbGetDoc,
  setDoc as fbSetDoc,
  updateDoc as fbUpdateDoc,
  collection as fbCollection,
  getDocs as fbGetDocs,
  query as fbQuery,
  where as fbWhere,
  addDoc as fbAddDoc,
} from "firebase/firestore";

// Read Firebase config from Vite environment variables (VITE_ prefix)
const liveConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Consider Firebase configured only when required env vars are present
const isFirebaseConfigured = Boolean(
  liveConfig.apiKey && liveConfig.projectId && liveConfig.appId,
);

let firebaseApp;
let realAuth;
let realDb;
let secondaryAuth;

if (isFirebaseConfigured) {
  firebaseApp = getApps().length === 0 ? initializeApp(liveConfig) : getApp();
  realAuth = getAuth(firebaseApp);
  realDb = getFirestore(firebaseApp);
  try {
    const secondaryApp = initializeApp(liveConfig, "SecondaryApp");
    secondaryAuth = getAuth(secondaryApp);
  } catch (e) {
    import("./utils/logger").then(({ warn }) => warn("Secondary app init failed", e));
  }
}

// ----------------------------------------------------
// SIMULATION / MOCK FALLBACK DATABASE
// ----------------------------------------------------

const MOCK_STORAGE_KEY = "school_erp_mock_db";

const getMockDb = () => {
  let dbData = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!dbData) {
    dbData = {
      users: {
        "admin-uid": {
          uid: "admin-uid",
          name: "Dr. Sarah Jenkins",
          email: "admin@school.com",
          password: "admin123",
          role: "admin",
        },
        "webadmin-uid": {
          uid: "webadmin-uid",
          name: "Web Content Manager",
          email: "webadmin@school.com",
          password: "webadmin123",
          role: "webadmin",
        },
        "teacher-uid": {
          uid: "teacher-uid",
          name: "Mr. Robert Harrison",
          email: "teacher@school.com",
          password: "teacher123",
          role: "teacher",
          class: "Class 10",
          section: "A",
        },
        "parent-uid": {
          uid: "parent-uid",
          name: "David Miller",
          email: "parent@school.com",
          password: "parent123",
          role: "parent",
          studentId: "student-1",
        },
      },
      students: [
        {
          id: "student-1",
          name: "Emily Miller",
          email: "emily@school.com",
          class: "Class 10",
          section: "A",
          rollNo: "101",
          fees: {
            total: 50000,
            paid: 35000,
            balance: 15000,
            dueDate: "2026-06-30",
            breakdown: {
              monthlyTuition: 3000,
              yearlyTerm: 10000,
              extraCharges: 4000
            }
          },
          attendanceHistory: [
            { date: "2026-06-16", status: "Present" },
            { date: "2026-06-15", status: "Present" },
            { date: "2026-06-12", status: "Present" },
            { date: "2026-06-11", status: "Absent" },
            { date: "2026-06-10", status: "Present" },
            { date: "2026-06-09", status: "Present" },
            { date: "2026-06-08", status: "Present" },
            { date: "2026-06-05", status: "Present" },
          ],
          overallAttendance: 88,
          marks: [
            {
              subject: "Mathematics",
              exam: "Mid-Term",
              marksObtained: 88,
              maxMarks: 100,
            },
            {
              subject: "Science",
              exam: "Mid-Term",
              marksObtained: 92,
              maxMarks: 100,
            },
            {
              subject: "English",
              exam: "Mid-Term",
              marksObtained: 85,
              maxMarks: 100,
            },
          ],
          concessions: [],
        },
        {
          id: "student-2",
          name: "James Wilson",
          email: "james@school.com",
          class: "Class 10",
          section: "A",
          rollNo: "102",
          fees: {
            total: 50000,
            paid: 50000,
            balance: 0,
            dueDate: "2026-06-30",
            breakdown: {
              monthlyTuition: 3000,
              yearlyTerm: 10000,
              extraCharges: 4000
            }
          },
          attendanceHistory: [
            { date: "2026-06-16", status: "Present" },
            { date: "2026-06-15", status: "Present" },
          ],
          overallAttendance: 100,
          marks: [
            {
              subject: "Mathematics",
              exam: "Mid-Term",
              marksObtained: 72,
              maxMarks: 100,
            },
            {
              subject: "Science",
              exam: "Mid-Term",
              marksObtained: 78,
              maxMarks: 100,
            },
          ],
          concessions: [],
        },
        {
          id: "student-3",
          name: "Sophia Chen",
          email: "sophia@school.com",
          class: "9B",
          section: "B",
          rollNo: "201",
          fees: {
            total: 48000,
            paid: 20000,
            balance: 28000,
            dueDate: "2026-06-25",
            breakdown: {
              monthlyTuition: 2800,
              yearlyTerm: 9000,
              extraCharges: 5400
            }
          },
          attendanceHistory: [
            { date: "2026-06-16", status: "Absent" },
            { date: "2026-06-15", status: "Present" },
          ],
          overallAttendance: 50,
          marks: [
            {
              subject: "Mathematics",
              exam: "Mid-Term",
              marksObtained: 95,
              maxMarks: 100,
            },
          ],
          concessions: [],
        },
      ],
      teachers: [
        {
          id: "teacher-uid",
          name: "Mr. Robert Harrison",
          email: "teacher@school.com",
          class: "Class 10",
          section: "A",
          designation: "Senior PGT Mathematics",
          joiningDate: "2022-08-10",
          salary: 45000,
          salaryDetails: {
            base: 40000,
            allowances: 5000,
            deductions: 0,
            net: 45000
          },
          bankDetails: "SBI A/C: 38291029302",
          syllabusCompletion: 78,
          status: "Present",
          checkIn: "08:30 AM",
          remarks: "On Time",
        },
      ],
      leaveRequests: [
        {
          id: "lr1",
          teacherId: "teacher-uid",
          teacherName: "Mr. Robert Harrison",
          days: "2 Days",
          reason: "Medical Checkup",
          status: "Pending",
          date: "2026-06-16",
        },
      ],
      feePaymentRequests: [
        {
          id: "pr1",
          studentId: "student-1",
          studentName: "Emily Miller",
          class: "Class 10",
          amountPaid: 15000,
          paymentDate: "2026-06-15",
          transactionId: "TXN123456789",
          message: "Paid remaining balance via GPay",
          status: "Approved",
        },
      ],
      notices: [
        {
          id: "n1",
          title: "Monsoon Break Notification",
          content:
            "Due to excessive rain warnings, college will remain closed tomorrow, June 17, 2026.",
          date: "2026-06-16",
          audience: "All",
        },
        {
          id: "n2",
          title: "Teacher Faculty Meeting",
          content:
            "All PGT teachers must report in the main conference room at 2 PM for syllabus review.",
          date: "2026-06-15",
          audience: "Teachers",
        },
      ],
      attendance: {},
      salarySlips: [
        {
          id: "ss1",
          teacherId: "teacher-uid",
          month: "May 2026",
          base: 45000,
          deductions: 1500,
          net: 43500,
          status: "Paid",
        },
      ],
      timetables: {
        "Class 10": [
          {
            period: "1st",
            time: "09:00 AM - 09:45 AM",
            subject: "Mathematics",
            teacherName: "Mr. Robert Harrison",
          },
          {
            period: "2nd",
            time: "09:45 AM - 10:30 AM",
            subject: "Science",
            teacherName: "Mrs. Anjali Sharma",
          },
          {
            period: "3rd",
            time: "10:45 AM - 11:30 AM",
            subject: "English",
            teacherName: "Ms. Priya Singh",
          },
        ],
      },
      homework: [
        {
          id: "hw1",
          class: "Class 10",
          subject: "Mathematics",
          title: "Algebra exercise 4.2",
          description: "Solve all questions from 1 to 10 in homework copy.",
          dueDate: "2026-06-18",
        },
      ],
      resources: [
        {
          id: "res1",
          title: "Class 10 Algebra Formulas Cheat Sheet",
          type: "PDF",
          url: "#",
          size: "1.2 MB",
        },
      ],
    };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(dbData));
  } else {
    dbData = JSON.parse(dbData);
  }
  return dbData;
};

const saveMockDb = (data) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
};

let mockCurrentUser = null;
const authListeners = [];

const notifyAuthListeners = () => {
  authListeners.forEach((cb) => cb(mockCurrentUser));
};

const cachedUser = sessionStorage.getItem("school_erp_auth_user");
if (cachedUser) {
  mockCurrentUser = JSON.parse(cachedUser);
}

// ----------------------------------------------------
// EXPORTS
// ----------------------------------------------------
export const auth = isFirebaseConfigured ? realAuth : { isMock: true };
export const db = isFirebaseConfigured ? realDb : { isMock: true };

// Auth API Wrapper
export const signInWithEmailAndPassword = async (authObj, email, password) => {
  if (!isFirebaseConfigured) {
    const database = getMockDb();
    const matchedUser = Object.values(database.users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (
      matchedUser &&
      typeof matchedUser.password === "string" &&
      matchedUser.password === password
    ) {
      mockCurrentUser = {
        uid: matchedUser.uid,
        email: matchedUser.email,
        displayName: matchedUser.name,
      };
      sessionStorage.setItem(
        "school_erp_auth_user",
        JSON.stringify(mockCurrentUser),
      );
      notifyAuthListeners();
      return { user: mockCurrentUser };
    }

    throw new Error("auth/invalid-credential");
  }
  return fbSignIn(authObj, email, password);
};

export const createUserWithEmailAndPassword = async (
  authObj,
  email,
  password,
) => {
  if (!isFirebaseConfigured) {
    // For mock mode: just validate and return a user object
    if (!email || password.length < 6) {
      throw new Error("Invalid email or password (min 6 chars)");
    }
    const mockUid = "mock_" + Math.random().toString(36).substring(2, 9);
    return {
      user: {
        uid: mockUid,
        email,
        displayName: "",
      },
    };
  }
  return fbCreateUser(authObj, email, password);
};

export const adminCreateUser = async (email, password) => {
  if (!isFirebaseConfigured) {
    if (!email || password.length < 6) {
      throw new Error("Invalid email or password (min 6 chars)");
    }
    const mockUid = "mock_" + Math.random().toString(36).substring(2, 9);
    return {
      user: {
        uid: mockUid,
        email,
        displayName: "",
      },
    };
  }
  return fbCreateUser(secondaryAuth || realAuth, email, password);
};

export const signOut = async (authObj) => {
  if (!isFirebaseConfigured) {
    mockCurrentUser = null;
    sessionStorage.removeItem("school_erp_auth_user");
    notifyAuthListeners();
    return;
  }
  return fbSignOut(authObj);
};

export const onAuthStateChanged = (authObj, callback) => {
  if (!isFirebaseConfigured) {
    authListeners.push(callback);
    callback(mockCurrentUser);
    return () => {
      const idx = authListeners.indexOf(callback);
      if (idx > -1) authListeners.splice(idx, 1);
    };
  }
  return fbOnAuthStateChanged(authObj, callback);
};

// Firestore API Wrapper
export const doc = (dbObj, collectionName, docId) => {
  if (!isFirebaseConfigured) {
    return { isMockRef: true, collectionName, docId };
  }
  return fbDoc(dbObj, collectionName, docId);
};

export const getDoc = async (docRef) => {
  if (!isFirebaseConfigured) {
    const database = getMockDb();
    const { collectionName, docId } = docRef;
    let data = null;

    if (collectionName === "users") {
      data = database.users[docId];
    } else if (collectionName === "attendance") {
      data = database.attendance[docId];
    }

    return {
      exists: () => !!data,
      data: () => data,
    };
  }
  return fbGetDoc(docRef);
};

export const setDoc = async (docRef, data) => {
  if (!isFirebaseConfigured) {
    const database = getMockDb();
    const { collectionName, docId } = docRef;

    if (collectionName === "users") {
      database.users[docId] = { ...data, uid: docId };
    } else if (collectionName === "attendance") {
      database.attendance[docId] = data;
    }

    saveMockDb(database);
    return;
  }
  return fbSetDoc(docRef, data);
};

export const updateDoc = async (docRef, data) => {
  if (!isFirebaseConfigured) {
    const database = getMockDb();
    const { collectionName, docId } = docRef;

    if (collectionName === "users") {
      database.users[docId] = { ...database.users[docId], ...data };
    } else if (collectionName === "attendance") {
      database.attendance[docId] = { ...database.attendance[docId], ...data };
    } else {
      // General handler for array collections (like students, teachers, etc)
      if (Array.isArray(database[collectionName])) {
        const idx = database[collectionName].findIndex(
          (item) => item.id === docId || item.uid === docId,
        );
        if (idx > -1) {
          database[collectionName][idx] = {
            ...database[collectionName][idx],
            ...data,
          };
        }
      } else if (database[collectionName] && typeof database[collectionName] === "object") {
        database[collectionName][docId] = {
          ...database[collectionName][docId],
          ...data,
        };
      }
    }

    saveMockDb(database);
    return;
  }
  return fbUpdateDoc(docRef, data);
};

export const collection = (dbObj, collectionName) => {
  if (!isFirebaseConfigured) {
    return { isMockCol: true, collectionName };
  }
  return fbCollection(dbObj, collectionName);
};

export const getDocs = async (queryOrColRef) => {
  if (!isFirebaseConfigured) {
    const database = getMockDb();
    const { collectionName, constraints } = queryOrColRef;
    let list = [];

    if (collectionName === "users") {
      list = Object.values(database.users);
    } else if (collectionName === "students") {
      list = database.students;
    } else if (collectionName === "teachers") {
      list = database.teachers;
    } else if (collectionName === "notices") {
      list = database.notices;
    } else if (collectionName === "leaveRequests") {
      list = database.leaveRequests;
    } else if (collectionName === "feePaymentRequests") {
      list = database.feePaymentRequests;
    } else if (collectionName === "salarySlips") {
      list = database.salarySlips;
    } else if (collectionName === "homework") {
      list = database.homework;
    } else if (collectionName === "resources") {
      list = database.resources;
    }

    if (constraints && constraints.length > 0) {
      constraints.forEach((constraint) => {
        if (constraint.type === "where") {
          const { field, op, value } = constraint;
          list = list.filter((item) => {
            if (op === "==") return item[field] === value;
            return true;
          });
        }
      });
    }

    return {
      docs: list.map((item) => ({
        id: item.id || item.uid,
        data: () => item,
      })),
    };
  }
  return fbGetDocs(queryOrColRef);
};

export const query = (colRef, ...constraints) => {
  if (!isFirebaseConfigured) {
    return { ...colRef, constraints };
  }
  return fbQuery(colRef, ...constraints);
};

export const where = (field, op, value) => {
  if (!isFirebaseConfigured) {
    return { type: "where", field, op, value };
  }
  return fbWhere(field, op, value);
};

export const addDoc = async (colRef, data) => {
  if (!isFirebaseConfigured) {
    const database = getMockDb();
    const { collectionName } = colRef;
    const newId = Math.random().toString(36).substring(2, 9);
    const newDoc = { ...data, id: newId };

    if (collectionName === "students") {
      database.students.push(newDoc);
    } else if (collectionName === "teachers") {
      database.teachers.push(newDoc);
    } else if (collectionName === "notices") {
      database.notices.push(newDoc);
    } else if (collectionName === "leaveRequests") {
      database.leaveRequests.push(newDoc);
    } else if (collectionName === "feePaymentRequests") {
      database.feePaymentRequests.push(newDoc);
    } else if (collectionName === "salarySlips") {
      database.salarySlips.push(newDoc);
    } else if (collectionName === "homework") {
      database.homework.push(newDoc);
    } else if (collectionName === "resources") {
      database.resources.push(newDoc);
    }

    saveMockDb(database);
    return { id: newId };
  }
  return fbAddDoc(colRef, data);
};

export const getRawMockDb = () => getMockDb();
export const resetMockDb = () => {
  localStorage.removeItem(MOCK_STORAGE_KEY);
  getMockDb();
};
export const isMockMode = !isFirebaseConfigured;
