import "dotenv/config";
import express from "express";
import { engine } from "express-handlebars";
import ImapService from "./src/imap/imap-service.js";
import SmtpService from "./src/smtp/smtp-service.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.engine(".hbs", engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.set("views", "./src/views");

app.use(express.static("public"));

const port = 3000;

const imapService = new ImapService();
const smtpService = new SmtpService();

app.get("/", async (req, res) => {
  const { body } = await imapService.getEmails();

  res.render("home", {
    emails: body,
  });
});

app.get("/email/new", async (req, res, next) => {
  try {
    res.render("new");
  } catch (e) {
    next(e);
  }
});

app.get("/email/:id", async (req, res, next) => {
  try {
    const { body } = await imapService.getEmail(req.params.id);

    res.render("email", body);
  } catch (e) {
    next(e);
  }
});

const apiRouter = express.Router();

apiRouter.get("/email", async (req, res, next) => {
  try {
    res.json(await imapService.getEmails());
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/email/:id", async (req, res, next) => {
  try {
    res.json(await imapService.getEmail(req.params.id));
  } catch (e) {
    next(e);
  }
});

apiRouter.post(
  "/email",
  upload.array("attachment", 10),
  async (req, res, next) => {
    try {
      let attachments;
      if (req.files && req.files.length) {
        attachments = req.files.map(({ mimetype, originalname, buffer }) => ({
          type: mimetype,
          name: originalname,
          body: buffer.toString("base64"),
        }));
        console.log("Uploaded: ", attachments);
      }
      const { to, subject, content } = req.body;
      await smtpService.sendEmail({
        to,
        subject,
        content,
        attachments,
      });
      res.send("Success");
    } catch (e) {
      next(e);
    }
  }
);

app.use("/api", apiRouter);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
