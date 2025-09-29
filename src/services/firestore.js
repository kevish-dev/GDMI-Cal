// src/services/firestore.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
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

// Rates data functions (example for your rates context)
export const saveRates = (ratesData) => createDocument("rates", ratesData);
export const getCurrentRates = () => getDocuments("rates", [
  orderBy("createdAt", "desc"),
  limit(1)
]);

// Export query helpers for advanced queries
export { where, orderBy, limit, serverTimestamp };