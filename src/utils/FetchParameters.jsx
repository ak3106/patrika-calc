import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function fetchPricingParameters() {
  try {
    // Point directly to the specific collection and fixed document ID
    const docRef = doc(db, "parameters", "pricing");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Parameters data:", docSnap.data());
      return docSnap.data(); // Returns your dynamic values object
    } else {
      console.log("No such document! Using default values.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching parameters:", error);
  }
}