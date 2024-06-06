const { Controller, Response } = require("pepesan");
const f = require("../utils/Formatter");
const moment = require('moment-timezone');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { default: makeWASocket, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

const combinedPendaftaranBPJS = `${f("template.menuPendaftaran")} ${f("menu.pendaftaranBPJS")}`;

module.exports = class BotController extends Controller {
    constructor() {
        super();
        this.initializeWhatsAppConnection();
    }

    async initializeWhatsAppConnection() {
        try {
            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`Using Baileys version: ${version}, is latest: ${isLatest}`);
            this.sock = makeWASocket({
                version,
                logger: console,
                printQRInTerminal: true
            });

            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401);
                    console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
                    if (shouldReconnect) {
                        this.initializeWhatsAppConnection();
                    }
                } else if (connection === 'open') {
                    console.log('Connected to WhatsApp');
                }
            });

            this.sock.ev.on('messages.upsert', async ({ messages }) => {
                const message = messages[0];
                if (!message.key.fromMe) {
                    await this.handleMessage(message);
                }
            });
        } catch (error) {
            console.error("Error initializing WhatsApp connection:", error);
        }
    }

    async handleMessage(message) {
        const request = this.formatRequest(message);
        const response = await this.introduction(request);
        if (response) {
            await this.reply(message.key.remoteJid, response);
        }
    }

    formatRequest(message) {
        return {
            name: message.pushName,
            message: message.message.conversation,
            session: {}
        };
    }

    async introduction(request) {
        request = request || {};
        request.session = request.session || {};

        const currentTime = moment.tz('Asia/Singapore');
        const userName = request.name || "Peserta";
        let greetingMessage;
        const hour = currentTime.hour();
        if (hour >= 0 && hour < 9) {
            greetingMessage = "Selamat Pagi";
        } else if (hour >= 9 && hour < 15) {
            greetingMessage = "Selamat Siang";
        } else if (hour >= 15 && hour < 19) {
            greetingMessage = "Selamat Sore";
        } else if (hour >= 19 && hour < 24) {
            greetingMessage = "Selamat Malam";
        } else {
            greetingMessage = "Waktu tidak valid";
        }

        if (typeof request.message === 'string') {
            const lowerCaseMessage = request.message.toLowerCase();
            if (lowerCaseMessage.includes('tanya')) {
                request.session.previousQuestion = true;
                return this.bpjsQuestions(request);
            } else if (lowerCaseMessage.includes('daftar')) {
                request.session.previousQuestion = true;
                return this.pendaftaranBPJS(request);
            } else {
                await this.reply("Maaf, BETA tidak mengerti yang kamu katakan. Silakan ketik 'tanya' untuk pertanyaan atau 'daftar' untuk informasi pendaftaran.");
                return;
            }
        }

        if (!request.session.previousQuestion) {
            await this.reply(`${greetingMessage}, ${userName} yang kami hormati, dengan Perlindungan Pekerja dari BPJS Ketenagakerjaan`);
            await this.reply("Bagaimana saya bisa membantu Anda?\n\nPesan ini akan dibalas oleh BPJS Ketenagakerjaaan Intelligence Assistant atau kamu bisa memanggilnya BETA");

            request.session.previousQuestion = false;

            return Response.menu.fromArrayOfString(
                [
                    f("menu.bpjsQuestions"),
                ],
                "Silakan pilih opsi berikut untuk informasi lebih lanjut:",
                f("template.menuPertanyaan"),
                combinedPendaftaranBPJS
            );
        }
    }

    async bpjsQuestions(request) {
        request = request || {};
        request.session = request.session || {};

        await this.reply("Apakah yang ingin Anda tanyakan?");

        const pdfPath = 'D:/bot-whatsapp-starter-project/pdfs/Pertanyaan 1.pdf';
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        let text = '';
        for (const page of pages) {
            const content = await page.getText();
            text += content;
        }

        const userQuestion = request.message.trim();
        const answer = findAnswer(text, userQuestion);

        await this.reply(answer);
    }

    async pendaftaranBPJS(request) {
        return this.reply("Jika ingin mendaftar kamu bisa kunjungi di website kami😊");
    }

    async reply(jid, message) {
        try {
            await this.sock.sendMessage(jid, { text: message });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }
};

function findAnswer(pdfText, userQuestion) {
    const questionRegex = new RegExp(userQuestion, 'i');
    const match = pdfText.match(questionRegex);
    if (match) {
        return pdfText.substring(match.index, match.index + 300);
    } else {
        return "Maaf, saya tidak menemukan jawaban untuk pertanyaan Anda.";
    }
}
