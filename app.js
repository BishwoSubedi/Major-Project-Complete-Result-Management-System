const path = require('path');
const env = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cors = require('cors');
const methodOverride = require('method-override');
const mysql = require('mysql');
const fs = require('fs');
const multer = require('multer');
const storage=multer.memoryStorage();
const upload=multer({storage:storage})
const fileupload=require('express-fileupload')
// const upload = multer({ dest: 'uploads/' });


env.config();
const app = express();

app.use(fileupload());
app.use(cors());
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(flash());


app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

const adminRoutes = require('./routes/admin');
const staffRoutes = require('./routes/staff');
const studentRoutes = require('./routes/student');
const homeRoutes = require('./routes/home');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use('/admin', adminRoutes);
app.use('/staff',staffRoutes);
app.use('/student', studentRoutes);
app.use('/', homeRoutes);

app.use(homeRoutes);




const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rms',
  
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');

    // Read and split the SQL script from cms.sql inside the "database" folder
    const sqlScriptPath = path.join(__dirname, 'database', 'cms.sql');
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
    const sqlStatements = sqlScript.split(';').filter((statement) => statement.trim() !== '');

    // Execute each SQL statement one by one
    sqlStatements.forEach((sqlStatement) => {
      connection.query(sqlStatement, (sqlErr, sqlResults) => {
        if (sqlErr) {
          console.error('Error running SQL statement:', sqlErr);
        } else {
          console.log('SQL statement executed successfully');
        }
      });
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started @ ${PORT}`);
});
