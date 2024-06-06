require('dotenv').config();
const Pepesan = require("pepesan");
const router = require("./router");
const { ALLOWED_NUMBERS } = process.env;

(async () => {
    const config = {
        allowedNumbers: ALLOWED_NUMBERS ? ALLOWED_NUMBERS.split(',') : null,
        browserName: 'DimBot'
    };
    const pepesan = Pepesan.init(router, config);

    // Pastikan tidak ada pemanggilan botControllerModule di sini

    await pepesan.connect();
})();
