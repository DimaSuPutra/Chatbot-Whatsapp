const moment = require('moment-timezone');

// Fungsi untuk mendapatkan waktu saat ini dalam GMT+8
function getCurrentTimeInGMT8() {
    return moment().tz('Asia/Singapore');
}

// Fungsi untuk menentukan kalimat sapaan berdasarkan waktu
function getGreetingMessage(time) {
    if (!time || !time.isValid()) {
        return "Waktu tidak tersedia"; // Tambahkan pesan default jika waktu tidak tersedia atau tidak valid
    }

    const hour = time.hour();

    if (hour >= 0 && hour < 9) { // Ubah dari 24 ke 0
        return "Selamat Pagi";
    } else if (hour >= 9 && hour < 15) {
        return "Selamat Siang";
    } else if (hour >= 15 && hour < 19) {
        return "Selamat Sore";
    } else if (hour >= 19 && hour < 24) {
        return "Selamat Malam";
    } else {
        return "Waktu tidak valid"; // Pengamanan tambahan
    }
}

// Mendapatkan waktu saat ini dalam GMT+8
const currentTime = getCurrentTimeInGMT8();

// Mendapatkan kalimat sapaan berdasarkan waktu
const greetingMessage = getGreetingMessage(currentTime);

console.log(greetingMessage); // Output: Selamat Siang (jika waktu tersedia)
