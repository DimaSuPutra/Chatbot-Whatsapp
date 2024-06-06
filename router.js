const { Router, Response } = require("pepesan");
const BotController = require("./controller/BotController");
const f = require("./utils/Formatter");

const router = new Router();

// Tambahkan penanganan untuk angka 1 dengan perintah bpjsQuestions
router.keyword("tanya", [BotController, "bpjsQuestions"]);

// Tambahkan penanganan untuk perintah menu lainnya
router.keyword("daftar", [BotController, "pendaftaranBPJS"]);
router.keyword("*", [BotController, "introduction"]);

module.exports = router;
