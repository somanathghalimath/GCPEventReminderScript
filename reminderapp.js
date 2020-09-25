const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKETNAME);
const fileName = process.env.FILENAME;
const remoteFile = bucket.file(fileName);

const csv = require('csv-parser');
const moment = require('moment');
const sgMail = require('@sendgrid/mail');

exports.appProcessor = (event, context) => {

    var today = moment().date();
    var currentMonth = moment().month() + 1;
    var flag = true;

    remoteFile.createReadStream()
        .pipe(csv())
        .on('data', (row) => {
            var bday = moment(row.Birthday, "MM-DD-YYYY");
            bdaydate = bday.date() - 1;
            bdaymonth = bday.month() + 1;

            var annday = moment(row.Anniversary, "MM-DD-YYYY");
            anndaydate = annday.date() - 1;
            anndaymonth = annday.month() + 1;

            if (today == bdaydate && currentMonth == bdaymonth) {
                sendEmail(row.Name, "bday")
                flag = false;
            }
            if (today == anndaydate && currentMonth == anndaymonth) {
                sendEmail(row.Name, "aniv")
                flag = false;
            }
        }).on('end', () => {
            if (flag) {
                sendEmail("No Events scheduled for Tomorrow", "");
            }
        });


    function sendEmail(name, remindertype) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        if (remindertype == "bday") {
            type = " has a Birthday tomorrow";
        } else if (remindertype == "aniv") {
            type = " has an Anniversary tomorrow";
        }

        const msg = {
            to: process.env.TO_ADDR,
            from: process.env.FROM_ADDR,
            subject: process.env.SUBJECT,
            text: name + type,
            html: '<strong>' + name + type + '</strong>',
        };
        sgMail.send(msg);
    }
};