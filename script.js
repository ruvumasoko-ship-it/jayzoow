// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBRDOjngQ2aMKmyO-hltQmpXkcsmzYH4xE",
    authDomain: "joowzeylivesteam.firebaseapp.com",
    projectId: "joowzeylivesteam",
    storageBucket: "joowzeylivesteam.firebasestorage.app",
    messagingSenderId: "214467755859",
    appId: "1:214467755859:web:8208af7207ae13592f2ba6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const modal = document.getElementById('authModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const navLoginBtn = document.getElementById('navLoginBtn');
const heroSignupBtn = document.getElementById('heroSignupBtn');
const googleBtn = document.getElementById('googleSignInBtn');
const phoneBtn = document.getElementById('phoneSignInBtn');
const phoneInputDiv = document.getElementById('phoneInputDiv');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const phoneNumberInput = document.getElementById('phoneNumber');
const otpCodeInput = document.getElementById('otpCode');
const showEmailForm = document.getElementById('showEmailForm');
const emailForm = document.getElementById('emailForm');
const emailActionBtn = document.getElementById('emailActionBtn');
const modalEmail = document.getElementById('modalEmail');
const modalPassword = document.getElementById('modalPassword');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const modalMsg = document.getElementById('modalMsg');
const appSection = document.getElementById('appSection');
const heroSection = document.querySelector('.hero');
const footerGallery = document.querySelector('.footer-gallery');
const userNameSpan = document.getElementById('userNameDisplay');
const clipsContainer = document.getElementById('clipsContainer');
const adminDashboard = document.getElementById('adminDashboard');
const totalUsersSpan = document.getElementById('totalUsers');
const totalVotesAllSpan = document.getElementById('totalVotesAll');
const pickWinnerBtn = document.getElementById('pickWinnerBtn');
const winnerResultDiv = document.getElementById('winnerResult');
const logoutBtnApp = document.getElementById('logoutBtnApp');

// Variables
let isLoginMode = true;
let currentUserRole = 'fan';
let confirmationResult = null;

// Helper Functions
function showMsg(msg, isError = true, target = modalMsg) {
    target.style.display = 'block';
    target.innerText = msg;
    target.className = `message ${isError ? 'error' : 'success'}`;
    setTimeout(() => target.style.display = 'none', 4000);
}

function openModal() {
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    phoneInputDiv.style.display = 'none';
    emailForm.style.display = 'none';
    showEmailForm.style.display = 'block';
}

// Event Listeners
navLoginBtn.onclick = openModal;
heroSignupBtn.onclick = openModal;
closeModalBtn.onclick = closeModal;

// Google Sign-In
googleBtn.onclick = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                role: 'fan',
                points: 0,
                badges: ['fan'],
                createdAt: new Date()
            });
        }
        closeModal();
    } catch (err) {
        showMsg(err.message, true);
    }
};

// Phone Authentication
phoneBtn.onclick = () => {
    phoneInputDiv.style.display = 'block';
};

sendOtpBtn.onclick = async () => {
    const phone = phoneNumberInput.value;
    if (!phone) {
        showMsg("Weka namba ya simu kwa +255...", true);
        return;
    }
    const appVerifier = new firebase.auth.RecaptchaVerifier('sendOtpBtn', { size: 'invisible' });
    try {
        confirmationResult = await auth.signInWithPhoneNumber(phone, appVerifier);
        showMsg("OTP imetumwa! Ingiza sasa.", false);
    } catch (err) {
        showMsg(err.message, true);
    }
};

verifyOtpBtn.onclick = async () => {
    const code = otpCodeInput.value;
    if (!code || !confirmationResult) {
        showMsg("Weka OTP", true);
        return;
    }
    try {
        const result = await confirmationResult.confirm(code);
        const user = result.user;
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                name: user.phoneNumber || "Mtumiaji wa Simu",
                email: user.phoneNumber,
                role: 'fan',
                points: 0,
                badges: ['fan'],
                createdAt: new Date()
            });
        }
        closeModal();
    } catch (err) {
        showMsg(err.message, true);
    }
};

// Email/Password
showEmailForm.onclick = () => {
    emailForm.style.display = 'block';
    showEmailForm.style.display = 'none';
};

toggleAuthMode.onclick = () => {
    isLoginMode = !isLoginMode;
    emailActionBtn.innerText = isLoginMode ? "Ingia" : "Jiandikishe";
    toggleAuthMode.innerText = isLoginMode ? "Bado huna akaunti? Jiandikishe" : "Tayari una akaunti? Ingia";
};

emailActionBtn.onclick = async () => {
    const email = modalEmail.value;
    const pwd = modalPassword.value;
    if (!email || !pwd) {
        showMsg("Jaza barua pepe na nenosiri", true);
        return;
    }
    try {
        if (isLoginMode) {
            await auth.signInWithEmailAndPassword(email, pwd);
        } else {
            const cred = await auth.createUserWithEmailAndPassword(email, pwd);
            await db.collection('users').doc(cred.user.uid).set({
                name: email.split('@')[0],
                email: email,
                role: 'fan',
                points: 0,
                badges: ['fan'],
                createdAt: new Date()
            });
        }
        closeModal();
    } catch (err) {
        showMsg(err.message, true);
    }
};

// Load Clips & Voting
async function loadClips() {
    clipsContainer.innerHTML = '<div class="clip-card">Loading...</div>';
    try {
        const snapshot = await db.collection('clips').get();
        if (snapshot.empty) {
            clipsContainer.innerHTML = '<div class="clip-card">Hakuna clips bado. Admin anaweza kuongeza.</div>';
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="clip-card">
                    <div class="clip-artist">🎤 ${data.artistName || 'Msanii'}</div>
                    <div class="clip-title">"${data.songTitle || 'Wimbo'}"</div>
                    <div class="clip-stats">
                        <span>❤️ <span id="votes-${doc.id}">${data.totalVotes || 0}</span> kura</span>
                        <button class="vote-btn" data-id="${doc.id}">Piga Kura</button>
                    </div>
                </div>
            `;
        });
        clipsContainer.innerHTML = html;
        
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.onclick = async () => {
                const clipId = btn.getAttribute('data-id');
                const user = auth.currentUser;
                if (!user) return;
                const voteRef = db.collection('clips').doc(clipId).collection('votes').doc(user.uid);
                const existing = await voteRef.get();
                if (existing.exists) {
                    alert("Umepiga kura tayari kwenye wimbo huu!");
                    return;
                }
                await voteRef.set({ votedAt: new Date() });
                await db.collection('clips').doc(clipId).update({
                    totalVotes: firebase.firestore.FieldValue.increment(1)
                });
                const span = document.getElementById(`votes-${clipId}`);
                if (span) span.innerText = parseInt(span.innerText) + 1;
                if (currentUserRole === 'admin') loadAdminStats();
            };
        });
    } catch (err) {
        clipsContainer.innerHTML = '<div class="clip-card">Error loading clips</div>';
    }
}

// Admin Functions
async function loadAdminStats() {
    if (currentUserRole !== 'admin') return;
    try {
        const usersSnap = await db.collection('users').get();
        totalUsersSpan.innerText = usersSnap.size;
        const clipsSnap = await db.collection('clips').get();
        let total = 0;
        clipsSnap.forEach(doc => total += (doc.data().totalVotes || 0));
        totalVotesAllSpan.innerText = total;
    } catch (err) {
        console.error(err);
    }
}

async function pickWinner() {
    try {
        const spotlight = await db.collection('guestSpotlight').doc('current').get();
        if (!spotlight.exists) {
            winnerResultDiv.innerHTML = '<span class="error">Spotlight haipo</span>';
            return;
        }
        const participants = spotlight.data().participants || [];
        if (participants.length === 0) {
            winnerResultDiv.innerHTML = '<span class="error">Hakuna washiriki</span>';
            return;
        }
        const winnerId = participants[Math.floor(Math.random() * participants.length)];
        const userDoc = await db.collection('users').doc(winnerId).get();
        const winnerName = userDoc.exists ? userDoc.data().name : winnerId;
        await db.collection('guestSpotlight').doc('current').update({
            winnerId: winnerId,
            isDrawn: true,
            drawDate: new Date()
        });
        winnerResultDiv.innerHTML = `<span class="success">🏆 Mshindi: ${winnerName}</span>`;
    } catch (err) {
        winnerResultDiv.innerHTML = `<span class="error">Error: ${err.message}</span>`;
    }
}

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        heroSection.style.display = 'none';
        if (footerGallery) footerGallery.style.display = 'none';
        appSection.style.display = 'block';
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        let role = 'fan';
        let name = user.email || user.phoneNumber || "Mtumiaji";
        
        if (userDoc.exists) {
            name = userDoc.data().name || name;
            role = userDoc.data().role || 'fan';
        }
        
        currentUserRole = role;
        userNameSpan.innerText = name;
        
        if (role === 'admin') {
            adminDashboard.style.display = 'block';
            loadAdminStats();
            pickWinnerBtn.onclick = pickWinner;
        } else {
            adminDashboard.style.display = 'none';
        }
        loadClips();
    } else {
        heroSection.style.display = 'block';
        if (footerGallery) footerGallery.style.display = 'block';
        appSection.style.display = 'none';
    }
});

// Logout
logoutBtnApp.onclick = () => auth.signOut();
