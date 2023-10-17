const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");

const mailgun = require("mailgun-js");
const { data } = require("jquery");
const DOMAIN = process.env.DOMAIN_NAME;
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dateStrings: "date",
  database: "rms",
});

// Database query promises
const zeroParamPromise = (sql) => {
  return new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
};

const queryParamPromise = (sql, queryParam) => {
  return new Promise((resolve, reject) => {
    db.query(sql, queryParam, (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
};

// LOGIN
exports.getLogin = (req, res, next) => {
  res.render("Staff/login");
};

exports.postLogin = async (req, res, next) => {
  try{
  const { email, password } = req.body;
  let errors = [];
  const sql1 = "SELECT * FROM staff WHERE email = ?";
  const users = await queryParamPromise(sql1, [email]);
  if (
    users.length === 0 ||
    !(await bcrypt.compare(password, users[0].password))
  ) {
    errors.push({ msg: "Email or Password is Incorrect" });
    res.status(401).render("Staff/login", { errors });
  } else {
    const token = jwt.sign({ id: users[0].st_id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect("/staff/dashboard");
  }
}
catch(err){
 console.log(err)
}
};

exports.getDashboard = async (req, res, next) => {
  const sql1 = "SELECT * FROM staff WHERE st_id = ?";
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);
  res.render("Staff/dashboard", { user: data[0], page_name: "overview" });
};

exports.getProfile = async (req, res, next) => {
  const sql1 = "SELECT * FROM staff WHERE st_id = ?";
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);
  const userDOB = data[0].dob;
  const sql2 = "SELECT d_name FROM department WHERE dept_id = ?";
  const deptData = await queryParamPromise(sql2, [data[0].dept_id]);

  const sql3 =
    "SELECT cl.class_id, cl.semester, cl.c_id, co.c_name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id;";
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render("Staff/profile", {
    user: data[0],
    userDOB,
    deptData,
    classData,
    page_name: "profile",
  });
};
exports.getAddResult = async (req, res, next) => {
  try {
    // Fetch departments
    const departmentQuery = "SELECT * FROM department";
    const departmentResults = await zeroParamPromise(departmentQuery);
    let departments = [];
    for (let i = 0; i < departmentResults.length; ++i) {
      departments.push(departmentResults[i].dept_id);
    }

    res.render("Staff/Result/addResult", 
    {
      page_name: "results",
      departments: departments,
    });
  } catch (error) {
    // Handle errors appropriately, e.g., send an error response
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Add this function to staffController.js
exports.fetchCourses = async (req, res, next) => {
  try {
    const { semester, department } = req.query; // Get semester and department from the query parameters

    // Query the database to fetch courses based on the selected semester and department
    const courseQuery ="SELECT * FROM course WHERE semester = ? AND dept_id = ?";
    const courseResults = await queryParamPromise(courseQuery, [
      semester,
      department,
    ]);

    // Extract course names from the results
    const courses = courseResults.map((result) => result.c_name);

    // Send the courses as a JSON response
    res.json({ courses });
  } catch (error) {
    // Handle errors appropriately, e.g., send an error response
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Route to handle the submission of the "Add Result" form
exports.postAddResult = async (req, res, next) => {
  const { semester, course, department } = req.body;

  // Check if Excel file is uploaded
  if (!req.files || !req.files.excelFile) {
    return res.status(400).json({ error: "Excel file is required" });
  }

  // Handle Excel file upload
  const file = req.files.excelFile;
  try {
    // Parse the Excel file
    const workbook = XLSX.read(file.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Initialize an array to store the data
    const data = [];

    // Iterate through rows starting from the second row (assuming the first row is header)
    for (let rowNum = 2; ; rowNum++) {
      const rollNumberCell = worksheet[`A${rowNum}`];
      const s_nameCell = worksheet[`B${rowNum}`];
      const gpaCell = worksheet[`C${rowNum}`];

      // Break if any of the cells is empty
      if (!rollNumberCell || !s_nameCell || !gpaCell) {
        break;
      }

      // Extract values from the cells
      const rollNo = rollNumberCell.v;
      const name = s_nameCell.v;
      const gpa = gpaCell.v;

      // Lookup 's_id' based on 'rollNo'
      const sql2 = "SELECT s_id FROM student WHERE rollNumber = ?";
      const sidResult = await queryParamPromise(sql2, [rollNo]);

      // Check if the query returned any results
      if (sidResult.length > 0) {
        const sid = sidResult[0].s_id;

        // Lookup 'c_id' based on the course name
        const sql3 = "SELECT c_id FROM course WHERE c_name = ? AND dept_id = ? AND semester = ?";
        const cidResult = await queryParamPromise(sql3, [
          course,
          department,
          semester,
        ]);

        // Check if the query returned any results
        if (cidResult.length > 0) {
          const c_id = cidResult[0].c_id;

          // Check if the result already exists in the database
          const existingResultQuery ="SELECT COUNT(*) AS count FROM result WHERE s_id = ? AND semester = ? AND c_id = ?";
          const existingResult = await queryParamPromise(existingResultQuery, [
            sid,
            semester,
            c_id,
          ]);

          if (existingResult[0].count === 0) {
            // Only push the data if semester is not null
            if (semester !== null) {
              // Push the data to the array
              data.push({
                department,
                course: c_id,
                rollNo,
                name,
                gpa,
                sid,
                semester,
              });
            } else {
              // Log an error if semester is null
              console.error(`Skipping data for rollNo: ${rollNo} due to null semester`);
            }
          } else {
            // Result already exists in the database
            req.flash("error_msg", "Result Already Exist");
            res.redirect("/staff/addresult");
            return; // Exit the loop and function
          }
        } else {
          // Handle the case where 'c_id' is not found for the given course name, department, and semester
          console.error(`c_id not found for course: ${course}, department: ${department}, semester: ${semester}`);
          // Add the error to the array
          req.flash("error_msg",`Course not found for course: ${course}, department: ${department}, semester: ${semester}`);
          res.redirect("/staff/addresult");
          return; // Exit the loop and function
        }
      } else {
        // Handle the case where 's_id' is not found for the given 'rollNo'
        console.error(`s_id not found for rollNo: ${rollNo}`);
        req.flash("error_msg", "Student not found");
        res.redirect("/staff/addresult");
        return; // Exit the loop and function
      }
    }

    // Check if there are missing student errors or sid not found errors
    if (data.length === 0) {
      // No valid data was processed, so return an error
      req.flash("error_msg", "No valid data found in the Excel file");
      res.redirect("/staff/addresult");
      return;
    }

    // Start a transaction
    await queryParamPromise("START TRANSACTION");

    // Logic to save the results to the database
    const insertSql = "INSERT INTO result (dept_id, s_id, semester, c_id, rollNumber, gpa) VALUES (?, ?, ?, ?, ?, ?)";
    
    // Iterate through the data array and insert each record into the database
    for (const {
      department,
      sid,
      semester,
      course: c_id,
      rollNo,
      gpa,
    } of data) {
      await queryParamPromise(insertSql, [
        department,
        sid,
        semester,
        c_id,
        rollNo,
        gpa,
      ]);
    }

    // Commit the transaction
    await queryParamPromise("COMMIT");

    // Flash a success message
    req.flash("success_msg", "Result added successfully");
    res.redirect("/staff/getresult");
  } catch (error) {
    // Rollback the transaction in case of an error
    await queryParamPromise("ROLLBACK");

    console.error("Error processing results:", error);

    // Flash the error message
    req.flash("error_msg", "Error processing results: " + error.message);
    res.redirect("/staff/addresult");
  }
};


//update result 
// Render the update result form
exports.getSetResult = async (req, res, next) => {
  try {
      // Retrieve the result ID from the URL parameter
      const res_id = req.params.id;

      // Query the database to fetch the result data
      const sql = 'SELECT * FROM result WHERE res_id = ?';
      const result = await queryParamPromise(sql, [res_id]);

      if (result.length === 0) {
          // Handle the case where the result is not found
          req.flash('error_msg', 'Result not found');
          res.redirect('/staff/getresult');
          return;
      }

      // Render the update form with the result data
      res.render('Staff/Result/setResult', {
          result: result[0], // Assuming there's only one result with the given ID
          page_name: 'results',
      });
  } catch (error) {
      console.error('Error fetching result for update:', error);
      // Handle errors appropriately, e.g., send an error response
      res.status(500).json({ error: 'Internal server error' });
  }
};

// Process the result update
exports.postSetResult = async (req, res, next) => {
  try {
      // Retrieve the updated result data from the form submission
      const { gpa, res_id } = req.body;

      // Update the result data in the database
      const updateSql = 'UPDATE result SET gpa = ? WHERE res_id = ?';
      const result = await queryParamPromise(updateSql, [gpa, res_id]);

      if (result.affectedRows === 0) {
          // Handle the case where the result is not found or not updated
          req.flash('error_msg', 'Result not found or not updated');
          res.redirect('/staff/getresult');
          return;
      }

      // Redirect back to the getResult page with a success message
      req.flash('success_msg', 'Result updated successfully');
      res.redirect('/staff/getresult');
  } catch (error) {
      console.error('Error updating result:', error);
      // Handle errors appropriately, e.g., send an error response
      res.status(500).json({ error: 'Internal server error' });
  }
};



exports.getResult = async (req, res, next) => {
  try {
    const sql = 'SELECT s.s_name AS student_name, s.rollNumber AS student_rollNumber, d.d_name AS department, c.c_name AS course_name, r.semester AS semester, r.res_id,r.gpa FROM result AS r JOIN student AS s ON r.s_id = s.s_id JOIN course AS c ON r.c_id = c.c_id JOIN department AS d ON r.dept_id = d.dept_id';

    const results = await zeroParamPromise(sql);
    console.log(results)
    res.render("Staff/Result/getResult", {
      data: results,
      page_name: "results",
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    // Pass an error message to the UI
    res.render(`Staff/Result/getResult`, {
      error: "Error fetching results. Please try again later.",
      page_name: "results",
    });
  }
};


exports.getLogout = (req, res, next) => {
  res.cookie('jwt', '', { maxAge: 1 });
//  res.cookie('jwt', '', { expires: new Date(0) });
  // res.clearCookie();
  req.flash("success_msg", "You are logged out");
  res.redirect("/staff/login");
};

// FORGOT PASSWORD
exports.getForgotPassword = (req, res, next) => {
  res.render("Staff/forgotPassword");
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).render("Staff/forgotPassword");
  }

  let errors = [];

  const sql1 = "SELECT * FROM staff WHERE email = ?";
  const results = await queryParamPromise(sql1, [email]);
  if (!results || results.length === 0) {
    errors.push({ msg: "That email is not registered!" });
    return res.status(401).render("Staff/forgotPassword", {
      errors,
    });
  }

  const token = jwt.sign(
    { _id: results[0].st_id },
    process.env.RESET_PASSWORD_KEY,
    { expiresIn: "5m" }
  );

  const data = {
    from: "noreplyCMS@mail.com",
    to: email,
    subject: "Reset Password Link",
    html: `<h2>Please click on given link to reset your password</h2>
                <p><a href="${process.env.URL}/staff/resetpassword/${token}">Reset Password</a></p>
                <hr>
                <p><b>The link will expire in 20m!</b></p>
              `,
  };

  const sql2 = "UPDATE staff SET resetLink = ? WHERE email = ?";
  db.query(sql2, [token, email], (err, success) => {
    if (err) {
      errors.push({ msg: "Error In ResetLink" });
      res.render("Staff/forgotPassword", { errors });
    } else {
      mg.messages().send(data, (err, body) => {
        if (err) throw err;
        else {
          req.flash("success_msg", "Reset Link Sent Successfully!");
          res.redirect("/staff/forgot-password");
        }
      });
    }
  });
};

exports.getResetPassword = (req, res, next) => {
  const resetLink = req.params.id;
  res.render("Staff/resetPassword", { resetLink });
};

exports.resetPassword = (req, res, next) => {
  const { resetLink, password, confirmPass } = req.body;

  let errors = [];

  if (password !== confirmPass) {
    req.flash("error_msg", "Passwords do not match!");
    res.redirect(`/staff/resetpassword/${resetLink}`);
  } else {
    if (resetLink) {
      jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, (err, data) => {
        if (err) {
          errors.push({ msg: "Token Expired!" });
          res.render("Staff/resetPassword", { errors });
        } else {
          const sql1 = "SELECT * FROM staff WHERE resetLink = ?";
          db.query(sql1, [resetLink], async (err, results) => {
            if (err || results.length === 0) {
              throw err;
            } else {
              let hashed = await bcrypt.hash(password, 8);

              const sql2 = "UPDATE staff SET password = ? WHERE resetLink = ?";
              db.query(sql2, [hashed, resetLink], (errorData, retData) => {
                if (errorData) {
                  throw errorData;
                } else {
                  req.flash(
                    "success_msg",
                    "Password Changed Successfully! Login Now"
                  );
                  res.redirect("/staff/login");
                }
              });
            }
          });
        }
      });
    } else {
      errors.push({ msg: "Authentication Error" });
      res.render("Staff/resetPassword", { errors });
    }
  }
};
