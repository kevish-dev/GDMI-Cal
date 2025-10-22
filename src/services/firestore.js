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

// Rates data functions (comprehensive for Jewellery calculator)

// Gold Rates Functions
export const createGoldRates = async (goldRates) => {
  try {
    // Use a fixed document ID for gold rates to maintain single source of truth
    const docRef = doc(db, "goldRates", "current");
    
    // Get existing rates to preserve as lastRate
    const existingDoc = await getDoc(docRef);
    let existingRates = [];
    if (existingDoc.exists()) {
      existingRates = existingDoc.data().rates || [];
    }
    
    // Merge new rates with last rates
    const updatedRates = goldRates.map(newRate => {
      const existingRate = existingRates.find(rate => rate.carat === newRate.carat);
      return {
        ...newRate,
        lastRate: existingRate ? existingRate.rate : newRate.rate // Set lastRate to previous value or current if first time
      };
    });
    
    await setDoc(docRef, {
      rates: updatedRates,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return updatedRates;
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
      { carat: "24K", rate: 7000, lastRate: 6950, lastUpdated: new Date().toISOString().split('T')[0] },
      { carat: "22K", rate: 6510, lastRate: 6460, lastUpdated: new Date().toISOString().split('T')[0] },
      { carat: "18K", rate: 5320, lastRate: 5280, lastUpdated: new Date().toISOString().split('T')[0] },
      { carat: "14K", rate: 4200, lastRate: 4160, lastUpdated: new Date().toISOString().split('T')[0] },
      { carat: "9K", rate: 2730, lastRate: 2700, lastUpdated: new Date().toISOString().split('T')[0] }
    ];

    const dummyDiamondRates = [
      { color: "GH", clarity: "VVS1", certification: "IGI", rate: 51332 },
      { color: "GH", clarity: "VVS1", certification: "Self", rate: 32333 },
      { color: "GH", clarity: "VVS2", certification: "IGI", rate: 51999 },
      { color: "GH", clarity: "VVS2", certification: "Self", rate: 33000 },
      { color: "HI", clarity: "VVS1", certification: "IGI", rate: 47332 },
      { color: "HI", clarity: "VVS1", certification: "Self", rate: 28499 },
      { color: "IJ", clarity: "VS1", certification: "IGI", rate: 42000 },
      { color: "IJ", clarity: "VS1", certification: "Self", rate: 24000 },
      { color: "JK", clarity: "SI1", certification: "IGI", rate: 36666 },
      { color: "JK", clarity: "SI1", certification: "Self", rate: 20500 },
      { color: "KL", clarity: "I1/I2/I3", certification: "IGI", rate: 32000 },
      { color: "KL", clarity: "I1/I2/I3", certification: "Self", rate: 17000 }
    ];

    const dummyMakingCharges = {
      chains: 2.5,
      plain: 3.5,
      temple: 7,
      italianGold: 18,
      diamond: 800 // Per gram for diamond jewelry
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

// Function to reset making charges to default values
export const resetMakingChargesToDefaults = async () => {
  try {
    const defaultMakingCharges = {
      chains: 2.5,
      plain: 3.5,
      temple: 7,
      italianGold: 18,
      diamond: 800
    };
    await createMakingCharges(defaultMakingCharges);
    return defaultMakingCharges;
  } catch (error) {
    console.error("Error resetting making charges to defaults:", error);
    throw error;
  }
};

// Analytics and Activity Functions

// System Analytics Functions
export const getSystemAnalytics = async () => {
  try {
    const docRef = doc(db, "systemData", "analytics");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Initialize with default analytics
      const defaultAnalytics = {
        totalCalculations: 0,
        goldCalculations: 0,
        diamondCalculations: 0,
        totalValue: 0,
        avgValue: 0,
        lastUpdated: serverTimestamp()
      };
      await setDoc(docRef, defaultAnalytics);
      return defaultAnalytics;
    }
  } catch (error) {
    console.error("Error getting system analytics:", error);
    throw error;
  }
};

export const updateSystemAnalytics = async (analytics) => {
  try {
    const docRef = doc(db, "systemData", "analytics");
    await setDoc(docRef, {
      ...analytics,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    return analytics;
  } catch (error) {
    console.error("Error updating system analytics:", error);
    throw error;
  }
};

export const subscribeToSystemAnalytics = (callback) => {
  const docRef = doc(db, "systemData", "analytics");
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback({
        totalCalculations: 0,
        goldCalculations: 0,
        diamondCalculations: 0,
        totalValue: 0,
        avgValue: 0
      });
    }
  });
};

// Activity Log Functions
export const logActivity = async (activityData) => {
  try {
    const activityLog = {
      ...activityData,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, "activityLogs"), activityLog);
    return { id: docRef.id, ...activityLog };
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

export const getRecentActivities = async (limitCount = 10) => {
  try {
    const activities = await getDocuments("activityLogs", [
      orderBy("timestamp", "desc"),
      limit(limitCount)
    ]);
    return activities;
  } catch (error) {
    console.error("Error getting recent activities:", error);
    throw error;
  }
};

export const subscribeToRecentActivities = (callback, limitCount = 10) => {
  const collectionRef = collection(db, "activityLogs");
  const q = query(collectionRef, orderBy("timestamp", "desc"), limit(limitCount));
  
  return onSnapshot(q, (querySnapshot) => {
    const activities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(activities);
  });
};

// Calculation Functions for better analytics
export const saveCalculationToFirebase = async (calculationData) => {
  try {
    // Clean the data by removing undefined values (Firebase doesn't support undefined)
    const cleanedData = {};
    Object.keys(calculationData).forEach(key => {
      if (calculationData[key] !== undefined) {
        cleanedData[key] = calculationData[key];
      }
    });
    
    const calculation = {
      ...cleanedData,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "calculations"), calculation);
    
    // Update system analytics
    const currentAnalytics = await getSystemAnalytics();
    const updatedAnalytics = {
      totalCalculations: currentAnalytics.totalCalculations + 1,
      goldCalculations: calculationData.type === 'gold' 
        ? currentAnalytics.goldCalculations + 1 
        : currentAnalytics.goldCalculations,
      diamondCalculations: calculationData.type === 'diamond' 
        ? currentAnalytics.diamondCalculations + 1 
        : currentAnalytics.diamondCalculations,
      totalValue: currentAnalytics.totalValue + calculationData.totalValue,
      avgValue: (currentAnalytics.totalValue + calculationData.totalValue) / (currentAnalytics.totalCalculations + 1)
    };
    
    await updateSystemAnalytics(updatedAnalytics);
    
    return { id: docRef.id, ...calculation };
  } catch (error) {
    console.error("Error saving calculation:", error);
    throw error;
  }
};

export const getCalculationsStats = async () => {
  try {
    const calculations = await getDocuments("calculations", [
      orderBy("timestamp", "desc")
    ]);
    
    const totalCalculations = calculations.length;
    const goldCalculations = calculations.filter(c => c.type === 'gold').length;
    const diamondCalculations = calculations.filter(c => c.type === 'diamond').length;
    const totalValue = calculations.reduce((sum, calc) => sum + (calc.totalValue || 0), 0);
    const avgValue = totalCalculations > 0 ? totalValue / totalCalculations : 0;
    
    return {
      totalCalculations,
      goldCalculations,
      diamondCalculations,
      totalValue,
      avgValue,
      calculations: calculations.slice(0, 100) // Return last 100 calculations for performance
    };
  } catch (error) {
    console.error("Error getting calculations stats:", error);
    throw error;
  }
};

// Initialize system data if it doesn't exist
export const initializeSystemData = async () => {
  try {
    const results = {};
    
    // Initialize analytics
    const existingAnalytics = await getSystemAnalytics();
    results.analytics = existingAnalytics;
    
    // Initialize activity log with system start activity
    const recentActivities = await getRecentActivities(1);
    if (recentActivities.length === 0) {
      await logActivity({
        type: 'system',
        action: 'System initialized',
        description: 'Admin dashboard system started',
        icon: 'Activity'
      });
    }
    
    results.activities = await getRecentActivities(10);
    
    return results;
  } catch (error) {
    console.error("Error initializing system data:", error);
    throw error;
  }
};

// Gold Premium Configuration Functions
export const getGoldPremiumConfig = async () => {
  try {
    const docRef = doc(db, "goldConfig", "premium");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Initialize with default config
      const defaultConfig = {
        premium: 0, // Default premium per gram
        basePrice: 0, // Last fetched base price from API
        lastApiPrice: 0, // Raw price from API (for 10g)
        lastUpdated: serverTimestamp(),
        autoUpdateEnabled: false,
        expiry: null
      };
      await setDoc(docRef, defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    console.error("Error getting gold premium config:", error);
    throw error;
  }
};

export const updateGoldPremiumConfig = async (config) => {
  try {
    const docRef = doc(db, "goldConfig", "premium");
    await setDoc(docRef, {
      ...config,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    return config;
  } catch (error) {
    console.error("Error updating gold premium config:", error);
    throw error;
  }
};

export const subscribeToGoldPremiumConfig = (callback) => {
  const docRef = doc(db, "goldConfig", "premium");
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback({
        premium: 0,
        basePrice: 0,
        lastApiPrice: 0,
        autoUpdateEnabled: false,
        expiry: null
      });
    }
  });
};

// Export query helpers for advanced queries
export { where, orderBy, limit, serverTimestamp };