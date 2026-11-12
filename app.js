import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebase web config supplied for the My Pharmacy project.
const firebaseConfig = {
  apiKey: "AIzaSyA8PhfipgGc_w_jHqMwmMagZvIhPcnw7XI",
  authDomain: "my-pharmacy-fe651.firebaseapp.com",
  projectId: "my-pharmacy-fe651",
  storageBucket: "my-pharmacy-fe651.firebasestorage.app",
  messagingSenderId: "872501320830",
  appId: "1:872501320830:web:42c1fbb242c0a4d08d0c2f",
  measurementId: "G-RSLZTF5QB8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = (id) => document.getElementById(id);
let mode = "login";
let currentShopId = null;
let currentRole = null;

function showMessage(id, message, isError=true) {
  $(id).textContent = message;
  $(id).style.color = isError ? "#a33" : "#087f5b";
}
function setMode(next) {
  mode = next;
  $("loginTab").classList.toggle("active", mode === "login");
  $("signupTab").classList.toggle("active", mode === "signup");
  $("shopFields").hidden = mode !== "signup";
  $("authSubmit").textContent = mode === "login" ? "লগইন" : "ফার্মেসি অ্যাকাউন্ট তৈরি করুন";
  showMessage("authMessage", "");
}
$("loginTab").addEventListener("click", () => setMode("login"));
$("signupTab").addEventListener("click", () => setMode("signup"));

$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("email").value.trim();
  const password = $("password").value;
  $("authSubmit").disabled = true;
  try {
    if (mode === "signup") {
      const shopName = $("shopName").value.trim();
      const shopAddress = $("shopAddress").value.trim();
      if (!shopName) throw new Error("ফার্মেসির নাম লিখুন।");
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;
      const shopRef = doc(collection(db, "shops"));
      // The first registered user becomes the owner of this new pharmacy.
      await setDoc(shopRef, {
        name: shopName, address: shopAddress, ownerUid: uid,
        createdAt: serverTimestamp(), status: "active"
      });
      await setDoc(doc(db, "shops", shopRef.id, "members", uid), {
        uid, email, role: "owner", active: true, createdAt: serverTimestamp()
      });
      showMessage("authMessage", "অ্যাকাউন্ট তৈরি হয়েছে।", false);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    showMessage("authMessage", friendlyError(error));
  } finally {
    $("authSubmit").disabled = false;
  }
});

function friendlyError(error) {
  const code = error?.code || "";
  if (code.includes("email-already-in-use")) return "এই ইমেইলে আগে অ্যাকাউন্ট খোলা হয়েছে।";
  if (code.includes("weak-password")) return "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন।";
  if (code.includes("invalid-credential")) return "ইমেইল বা পাসওয়ার্ড সঠিক নয়।";
  if (code.includes("permission-denied")) return "Firebase Rules অনুমতি দেয়নি। README-এর Rules ধাপ সম্পন্ন হয়েছে কি না দেখুন।";
  return error?.message || "সমস্যা হয়েছে। আবার চেষ্টা করুন।";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentShopId = null;
    $("authView").hidden = false;
    $("appView").hidden = true;
    return;
  }
  try {
    const memberships = await getDocs(collection(db, "users", user.uid, "memberships"));
    // Membership lookup is populated after shop setup; fallback searches owned shop.
    let found = null;
    for (const membership of memberships.docs) {
      const data = membership.data();
      if (data.active) { found = {shopId: data.shopId, role: data.role}; break; }
    }
    if (!found) {
      const { getDocs: getAllDocs, collection: col, query: q, where } = await import("https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js");
      const owned = await getAllDocs(q(col(db, "shops"), where("ownerUid", "==", user.uid)));
      if (!owned.empty) found = {shopId: owned.docs[0].id, role: "owner"};
    }
    if (!found) throw new Error("এই অ্যাকাউন্টের সঙ্গে কোনো ফার্মেসি পাওয়া যায়নি।");
    currentShopId = found.shopId;
    currentRole = found.role;
    const shopSnap = await getDoc(doc(db, "shops", currentShopId));
    $("shopTitle").textContent = shopSnap.data()?.name || "আমার ফার্মেসি";
    $("userRole").textContent = `লগইন: ${user.email}`;
    $("memberRole").textContent = currentRole === "owner" ? "মালিক" : currentRole;
    $("authView").hidden = true;
    $("appView").hidden = false;
    await loadProducts();
  } catch (error) {
    showMessage("authMessage", friendlyError(error));
    await signOut(auth);
  }
});

$("logoutBtn").addEventListener("click", () => signOut(auth));

async function loadProducts() {
  if (!currentShopId) return;
  const q = query(collection(db, "shops", currentShopId, "products"), orderBy("name"));
  const snapshot = await getDocs(q);
  $("productCount").textContent = snapshot.size;
  const list = $("productList");
  list.innerHTML = "";
  if (snapshot.empty) {
    list.innerHTML = '<p class="hint">এখনো কোনো ওষুধ যোগ করা হয়নি।</p>';
    return;
  }
  snapshot.forEach((item) => {
    const p = item.data();
    const row = document.createElement("div");
    row.className = "product-item";
    const name = document.createElement("strong");
    name.textContent = p.name;
    const qty = document.createElement("span");
    qty.textContent = `${p.quantity} ${p.unit}`;
    row.append(name, qty);
    list.append(row);
  });
}

$("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!["owner", "manager"].includes(currentRole)) {
    showMessage("productMessage", "আপনার ওষুধ যোগ করার অনুমতি নেই।");
    return;
  }
  try {
    await addDoc(collection(db, "shops", currentShopId, "products"), {
      name: $("medicineName").value.trim(),
      quantity: Number($("medicineQty").value),
      unit: $("medicineUnit").value.trim(),
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid
    });
    $("productForm").reset();
    $("medicineUnit").value = "পিস";
    showMessage("productMessage", "ওষুধ যোগ হয়েছে।", false);
    await loadProducts();
  } catch (error) {
    showMessage("productMessage", friendlyError(error));
  }
});
