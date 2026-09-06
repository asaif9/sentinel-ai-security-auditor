import { initializeApp, getApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

initializeApp({
  credential: applicationDefault(),
  projectId: firebaseConfig.projectId,
});

async function test() {
  try {
    console.log("Testing with applicationDefault()");
    const db1 = getFirestore(getApp(), firebaseConfig.firestoreDatabaseId);
    await db1.collection('test_connection').doc('status').set({ status: 'ok' });
    console.log("db1 success");
  } catch (e) {
    console.error("db1 error:", e);
  }
}

test();
