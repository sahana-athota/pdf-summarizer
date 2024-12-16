import { createServer } from 'http'; 
import { IncomingForm } from 'formidable'; 
import bodyParser from "body-parser";
import express from "express";
import {dirname} from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import 'dotenv/config'

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const __dirname=dirname(fileURLToPath(import.meta.url));


var name='';
var fpath='';
var size=0;
var summary='';
var m=false;

app.use(express.static(__dirname + '/public'));



const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


app.get("/", async (req, res) => {
  res.render("test.ejs",{loading:false,message:false});
});

app.get('/summary', async (req, res) => {
  if (size>2250000 && size<24000000){
    await new Promise(r => setTimeout(r, 3000));
  }
  else if (size>30000000){
    console.log('file is too large');
    res.render("test.ejs",{loading:false,message:true});
  }
  await new Promise(r => setTimeout(r, 7000));
  res.render("summary.ejs",{summary:summary,name:name});
});

app.post('/submit', async (req, res) => {
  await pdf(req);
  res.render("test.ejs",{loading:true,message:false});
  console.log(name,fpath);
});


async function gapi(){
  if (size<25000000){
    const uploadResult = await fileManager.uploadFile(
        fpath,
        {
          mimeType: "application/pdf",
          displayName: name,
        },
      );
      const result = await model.generateContent([
        "summarise this pdf.",
        {
          fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
          },
        },
      ]);
      summary=result.response.text();
    }
}

function pdf(req){
    var form = new IncomingForm(); 
        form.parse(req, function (err, fields, files) { 
            console.log('in forms')
            if (err) {
                console.log(err);
                
            }
            var uploadedFile = files.filetoupload[0];
            var tempFilePath = uploadedFile.filepath; 
            var originalFilename = uploadedFile.originalFilename;
            size=uploadedFile.size;
            fpath=tempFilePath;
            name=originalFilename;
            console.log(uploadedFile.size,tempFilePath,originalFilename);
            gapi();
        })
};
var port=3000;
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });