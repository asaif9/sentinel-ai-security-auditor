import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

initializeApp({
  projectId: firebaseConfig.projectId,
});

async function test() {
  try {
    console.log("Testing with getFirestore(app, dbId)");
    const db1 = getFirestore(getApp(), firebaseConfig.firestoreDatabaseId);
    await db1.collection('test_connection').doc('status').set({ status: 'ok' });
    console.log("db1 success");
  } catch (e) {
    console.error("db1 error:", e);
  }

  try {
    console.log("Testing with getFirestore(dbId)");
    const db2 = getFirestore(firebaseConfig.firestoreDatabaseId);
    await db2.collection('test_connection').doc('status').set({ status: 'ok' });
    console.log("db2 success");
  } catch (e) {
    console.error("db2 error:", e);
  }
}

test();
