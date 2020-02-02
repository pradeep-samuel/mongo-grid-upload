const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');

const app = express();

//Middleware

app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine','ejs');

const mongoConnUrl = 'mongodb://127.0.0.1:27017/mongo-uploads';

const conn = mongoose.createConnection(mongoConnUrl);


// Initialize gfs
let gfs;

conn.once('open', () =>  {
    // initialize the stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads')
})

//Create storage engine
var storage = new GridFsStorage({
url: mongoConnUrl,
file: (req, file) => {
    return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buf) => {
        if (err) {
            return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
        };
        resolve(fileInfo);
    });
    });
    }
});

const upload = multer({ storage });

  // @route GET /
  // @desc Loads form

app.get('/', (req,res) => {
    res.render('index')
});

app.post('/upload', upload.single('file'),(req,res) => {
    res.json({ file: req.file})
})


app.get('/files', (req,res) => {
    gfs.files.find().toArray((err, files) => {

        if(!files || files.length === 0) {
            return res.status(404).json({
                err: 'No files exist'
            });
        }

        return res.json(files)
    });


})

const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`))
