MY PHARMACY — Firebase Starter (প্রাথমিক সংস্করণ)

এই ফাইলগুলো অ্যাপ তৈরির ভিত্তি। এটি এখনো Play Store-এ প্রকাশ বা বাস্তব ফার্মেসিতে ব্যবহারের জন্য প্রস্তুত নয়।

আপনার Firebase project:
- Project ID: my-pharmacy-fe651
- Authentication: Email/Password চালু থাকতে হবে
- Firestore: (default) database তৈরি থাকতে হবে

ফাইল চালানোর সহজ পথ:
1. ZIP extract করে index.html, style.css, app.js ও firestore.rules একসঙ্গে রাখুন।
2. Firebase Console > Firestore Database > Rules খুলুন।
3. firestore.rules ফাইলের সম্পূর্ণ লেখা Rules editor-এ বসিয়ে Publish চাপুন।
4. Firebase Console > Authentication > Sign-in method-এ Email/Password Enabled আছে নিশ্চিত করুন।
5. এই ফাইলগুলো একটি HTTPS hosting-এ প্রকাশ করতে হবে। শুধু ফোনে HTML ফাইল খুললে Firebase module import/Authentication নির্ভরযোগ্যভাবে কাজ নাও করতে পারে।
6. Hosting সেটআপের আগে আমাকে জানান—আমি পরের ধাপে ফোন দিয়ে প্রকাশ করার পদ্ধতি দেখাব।

এতে এখন যা আছে:
- ফার্মেসির মালিকের Email/Password signup ও login
- নতুন ফার্মেসির নাম ও ঠিকানা সংরক্ষণ
- আলাদা shop document ও owner membership
- owner/manager ভিত্তিক প্রাথমিক product permission
- ওষুধের নাম ও পরিমাণ যোগ/দেখা

গুরুত্বপূর্ণ সীমাবদ্ধতা:
- কর্মচারী/ম্যানেজার invite ও account linking এখনো তৈরি হয়নি।
- এই build-এ POS billing, sale posting, stock decrement, expiry/batch, prescription checks, offline queue, reports, PDF/print bill এখনো নেই।
- sales writes rules-এ বন্ধ রাখা হয়েছে। কারণ বিক্রয়ের সঙ্গে stock update অবশ্যই trusted atomic transaction/backend দিয়ে করতে হবে।
- মালিকের shop membership তৈরি হওয়ার পর app code-এ একটি user membership lookup আছে; এই starter-এর পরবর্তী iteration-এ membership indexing ও employee invitation flow সম্পূর্ণ করতে হবে।
- Production ব্যবহারের আগে security review, App Check, backups, audit logs, transactional Cloud Functions, privacy policy এবং বাংলাদেশের প্রযোজ্য DGDA/আইনি নিয়ম যাচাই জরুরি।
- Firebase web config browser app-এ থাকা স্বাভাবিক; Service Account private key, password বা secret কখনো শেয়ার করবেন না।

এটি একটি development starter, সম্পূর্ণ pharmacy management software নয়।
