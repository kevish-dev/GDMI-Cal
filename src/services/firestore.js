// src/services/firestore.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase.js";

/**
 * Firestore Service Functions
 * Common CRUD operations for Firestore database
 */

// Generic function to create a document
export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
};

// Generic function to get a document by ID
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Document not found");
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

// Generic function to get all documents from a collection
export const getDocuments = async (collectionName, constraints = []) => {
  try {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting documents:", error);
    throw error;
  }
};

// Generic function to update a document
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id: docId, ...data };
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

// Generic function to delete a document
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return docId;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// Function to listen to real-time updates
export const subscribeToDocument = (collectionName, docId, callback) => {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

// Function to listen to collection changes
export const subscribeToCollection = (collectionName, callback, constraints = []) => {
  const collectionRef = collection(db, collectionName);
  const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(documents);
  });
};

// Specific functions for common use cases

// User-related functions
export const createUser = (userData) => createDocument("users", userData);
export const getUser = (userId) => getDocument("users", userId);
export const updateUser = (userId, userData) => updateDocument("users", userId, userData);
export const deleteUser = (userId) => deleteDocument("users", userId);

// Example: Get user by email
export const getUserByEmail = async (email) => {
  try {
    const users = await getDocuments("users", [where("email", "==", email)]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
};

// Get user by username
export const getUserByUsername = async (username) => {
  try {
    const users = await getDocuments("users", [where("username", "==", username)]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error("Error getting user by username:", error);
    throw error;
  }
};

// Calculator data functions (example for your app)
export const saveCalculation = (calculationData) => createDocument("calculations", calculationData);
export const getUserCalculations = (userId) => getDocuments("calculations", [
  where("userId", "==", userId),
  orderBy("createdAt", "desc")
]);

// Rates data functions (comprehensive for jewelry calculator)

// Gold Rates Functions
export const createGoldRates = async (goldRates) => {
  try {
    // Use a fixed document ID for gold rates to maintain single source of truth
    const docRef = doc(db, "goldRates", "current");
    await setDoc(docRef, {
      rates: goldRates,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return goldRates;
  } catch (error) {
    console.error("Error creating/updating gold rates:", error);
    throw error;
  }
};

export const getGoldRates = async () => {
  try {
    const docRef = doc(db, "goldRates", "current");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.rates || [];
    } else {
      return null; // No rates exist yet
    }
  } catch (error) {
    console.error("Error getting gold rates:", error);
    throw error;
  }
};

export const subscribeToGoldRates = (callback) => {
  const docRef = doc(db, "goldRates", "current");
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.rates || []);
    } else {
      callback([]);
    }
  });
};

// Diamond Rates Functions
export const createDiamondRates = async (diamondRates) => {
  try {
    const docRef = doc(db, "diamondRates", "current");
    await setDoc(docRef, {
      rates: diamondRates,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return diamondRates;
  } catch (error) {
    console.error("Error creating/updating diamond rates:", error);
    throw error;
  }
};

export const getDiamondRates = async () => {
  try {
    const docRef = doc(db, "diamondRates", "current");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.rates || [];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting diamond rates:", error);
    throw error;
  }
};

export const subscribeToDiamondRates = (callback) => {
  const docRef = doc(db, "diamondRates", "current");
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.rates || []);
    } else {
      callback([]);
    }
  });
};

// Making Charges Functions
export const createMakingCharges = async (makingCharges) => {
  try {
    const docRef = doc(db, "makingCharges", "current");
    await setDoc(docRef, {
      charges: makingCharges,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return makingCharges;
  } catch (error) {
    console.error("Error creating/updating making charges:", error);
    throw error;
  }
};

export const getMakingCharges = async () => {
  try {
    const docRef = doc(db, "makingCharges", "current");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.charges || null;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting making charges:", error);
    throw error;
  }
};

export const subscribeToMakingCharges = (callback) => {
  const docRef = doc(db, "makingCharges", "current");
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.charges || null);
    } else {
      callback(null);
    }
  });
};

// Initialize dummy rates if they don't exist
export const initializeDummyRates = async () => {
  try {
    const dummyGoldRates = [
      { carat: "24K", rate: 7000, lastUpdated: new Date().toISOString().split('T')[0] },
      { carat: "22K", rate: 6510, lastUpdated: new Date().toISOString().split('T')[0] },
      { carat: "18K", rate: 5320, lastUpdated: new Date().toISOString().split('T')[0] },
      { carat: "14K", rate: 4200, lastUpdated: new Date().toISOString().split('T')[0] },
      { carat: "9K", rate: 2730, lastUpdated: new Date().toISOString().split('T')[0] }
    ];

    const dummyDiamondRates = [
      { color: "GH", clarity: "VVS1", certification: "IGI", rate: 45000 },
      { color: "GH", clarity: "VVS2", certification: "IGI", rate: 42000 },
      { color: "GH", clarity: "VS1", certification: "IGI", rate: 38000 },
      { color: "GH", clarity: "VS2", certification: "IGI", rate: 35000 },
      { color: "HI", clarity: "VVS1", certification: "IGI", rate: 40000 },
      { color: "HI", clarity: "VVS2", certification: "IGI", rate: 37000 },
      { color: "IJ", clarity: "VS1", certification: "IGI", rate: 32000 },
      { color: "JK", clarity: "SI1", certification: "Self", rate: 25000 },
      { color: "KL", clarity: "SI2", certification: "None", rate: 20000 }
    ];

    const dummyMakingCharges = {
      chains: 2.5,
      plain: 3.5,
      temple: 7,
      italianGold: 18
    };

    // Check if rates already exist
    const existingGoldRates = await getGoldRates();
    const existingDiamondRates = await getDiamondRates();
    const existingMakingCharges = await getMakingCharges();

    const results = {};

    // Initialize only if they don't exist
    if (!existingGoldRates) {
      await createGoldRates(dummyGoldRates);
      results.goldRates = dummyGoldRates;
    } else {
      results.goldRates = existingGoldRates;
    }

    if (!existingDiamondRates) {
      await createDiamondRates(dummyDiamondRates);
      results.diamondRates = dummyDiamondRates;
    } else {
      results.diamondRates = existingDiamondRates;
    }

    if (!existingMakingCharges) {
      await createMakingCharges(dummyMakingCharges);
      results.makingCharges = dummyMakingCharges;
    } else {
      results.makingCharges = existingMakingCharges;
    }

    return results;
  } catch (error) {
    console.error("Error initializing dummy rates:", error);
    throw error;
  }
};

// Export query helpers for advanced queries
export { where, orderBy, limit, serverTimestamp };