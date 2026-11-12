import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

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
const $ = id => document.getElementById(id);
let mode = "login", currentShopId = null, currentRole = null, creatingAccount = false;

function msg(id, text, error=true) { $(id).textContent=text; $(id).style.color=error?"#a33":"#087f5b"; }
function setMode(next) {
  mode=next;
  $("loginTab").classList.toggle("active",mode==="login");
  $("signupTab").classList.toggle("active",mode==="signup");
  $("shopFields").hidden=mode!=="signup";
  $("authSubmit").textContent=mode==="login"?"লগইন":"ফার্মেসি অ্যাকাউন্ট তৈরি করুন";
  msg("authMessage","");
}
$("loginTab").addEventListener("click",()=>setMode("login"));
$("signupTab").addEventListener("click",()=>setMode("signup"));

async function dashboard(user, shopId, role) {
  currentShopId=shopId; currentRole=role;
  const snap=await getDoc(doc(db,"shops",shopId));
  if(!snap.exists()) throw new Error("ফার্মেসির তথ্য পাওয়া যায়নি।");
  $("shopTitle").textContent=snap.data().name||"আমার ফার্মেসি";
  $("userRole").textContent=`লগইন: ${user.email||""}`;
  $("memberRole").textContent=role==="owner"?"মালিক":role==="manager"?"ম্যানেজার":"কর্মচারী";
  $("authView").hidden=true; $("appView").hidden=false;
  await loadProducts();
}
function friendly(e) {
  const c=e?.code||"";
  if(c.includes("email-already-in-use")) return "এই ইমেইলে আগে অ্যাকাউন্ট খোলা হয়েছে।";
  if(c.includes("weak-password")) return "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন।";
  if(c.includes("invalid-credential")) return "ইমেইল বা পাসওয়ার্ড সঠিক নয়।";
  if(c.includes("permission-denied")) return "Firebase Rules অনুমতি দেয়নি। নতুন Rules প্রকাশ হয়েছে কি না দেখুন।";
  return e?.message||"সমস্যা হয়েছে। আবার চেষ্টা করুন।";
}
$("authForm").addEventListener("submit",async ev=>{
  ev.preventDefault(); $("authSubmit").disabled=true;
  try {
    const email=$("email").value.trim(), password=$("password").value;
    if(mode==="signup") {
      const shopName=$("shopName").value.trim(), address=$("shopAddress").value.trim();
      if(!shopName) throw new Error("ফার্মেসির নাম লিখুন।");
      creatingAccount=true;
      const cred=await createUserWithEmailAndPassword(auth,email,password);
      const uid=cred.user.uid, shopRef=doc(collection(db,"shops"));
      await setDoc(shopRef,{name:shopName,address,ownerUid:uid,createdAt:serverTimestamp(),status:"active"});
      await setDoc(doc(db,"shops",shopRef.id,"members",uid),{uid,email,role:"owner",active:true,createdAt:serverTimestamp()});
      await setDoc(doc(db,"users",uid),{shopId:shopRef.id,role:"owner",email,createdAt:serverTimestamp()});
      await dashboard(cred.user,shopRef.id,"owner");
      msg("authMessage","ফার্মেসির অ্যাকাউন্ট তৈরি হয়েছে।",false);
      creatingAccount=false;
    } else {
      await signInWithEmailAndPassword(auth,email,password);
    }
  } catch(e) {
    creatingAccount=false; msg("authMessage",friendly(e));
    if(auth.currentUser && mode==="signup") await signOut(auth);
  } finally { $("authSubmit").disabled=false; }
});
onAuthStateChanged(auth,async user=>{
  if(creatingAccount) return;
  if(!user) { currentShopId=null;currentRole=null;$("authView").hidden=false;$("appView").hidden=true;return; }
  try {
    const profile=await getDoc(doc(db,"users",user.uid));
    if(!profile.exists()) throw new Error("এই অ্যাকাউন্টের ফার্মেসি প্রোফাইল পাওয়া যায়নি।");
    const p=profile.data(); await dashboard(user,p.shopId,p.role||"owner");
  } catch(e) { msg("authMessage",friendly(e)); }
});
$("logoutBtn").addEventListener("click",()=>signOut(auth));
async function loadProducts() {
  if(!currentShopId)return;
  const snap=await getDocs(query(collection(db,"shops",currentShopId,"products"),orderBy("name")));
  $("productCount").textContent=snap.size; const list=$("productList");list.innerHTML="";
  if(snap.empty){list.innerHTML='<p class="hint">এখনো কোনো ওষুধ যোগ করা হয়নি।</p>';return;}
  snap.forEach(d=>{const p=d.data(),row=document.createElement("div");row.className="product-item";const n=document.createElement("strong"),q=document.createElement("span");n.textContent=p.name;q.textContent=`${p.quantity} ${p.unit}`;row.append(n,q);list.append(row);});
}
$("productForm").addEventListener("submit",async ev=>{
  ev.preventDefault();
  if(!["owner","manager"].includes(currentRole)){msg("productMessage","আপনার ওষুধ যোগ করার অনুমতি নেই।");return;}
  try {
    await addDoc(collection(db,"shops",currentShopId,"products"),{name:$("medicineName").value.trim(),quantity:Number($("medicineQty").value),unit:$("medicineUnit").value.trim(),createdAt:serverTimestamp(),createdBy:auth.currentUser.uid});
    $("productForm").reset();$("medicineUnit").value="পিস";msg("productMessage","ওষুধ যোগ হয়েছে।",false);await loadProducts();
  } catch(e){msg("productMessage",friendly(e));}
});
