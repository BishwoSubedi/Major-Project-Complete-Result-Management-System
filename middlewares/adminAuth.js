const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dateStrings: 'date',
  database: 'rms',
});

const selectID = (id) => {
  return new Promise((resolve, reject) => {
    const sql1 = 'SELECT name FROM admin WHERE admin_id = ?';
    db.query(sql1, [id], (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
};

// const requireAuth = (req, res, next) => {
//   const token = req.cookies.jwt;
//   if (token) {
//     jwt.verify(token, process.env.JWT_SECRET, async (err, result) => {
//       if (err) {
//         req.flash(
//           'error_msg',
//           'You need to login as ADMIN in order to view that source!'
//         );
//         res.redirect('/unauthorized');
//       } else {
//         const data = await selectID(result.id);
//         if (data.length === 0) {
//           req.flash(
//             'error_msg',
//             'You need to login as ADMIN in order to view that source!'
//           );
//           res.redirect('/unauthorized');
//         } else {
//           req.user = result.id;
//           next();
//         }
//       }
//     });
//   } else {
//     req.flash(
//       'error_msg',
//       'You need to login as ADMIN in order to view that source!'
//     );
//     res.redirect('/unauthorized');
//   }
// };

const requireAuth = (req, res, next) => {
  // Define an array of routes that should not require authentication
  const publicRoutes = ['/admin/addStaffWithoutAuth']; // Add more routes if needed

  // Check if the requested URL is in the publicRoutes array
  if (publicRoutes.includes(req.path)) {
    // If it's a public route, simply pass control to the next middleware or route
    next();
  } else {
    // If it's not a public route, perform the authentication check as before
    const token = req.cookies.jwt;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, async (err, result) => {
        if (err) {
          req.flash(
            'error_msg',
            'You need to login as ADMIN in order to view that source!'
          );
          res.redirect('/unauthorized');
        } else {
          const data = await selectID(result.id);
          if (data.length === 0) {
            req.flash(
              'error_msg',
              'You need to login as ADMIN in order to view that source!'
            );
            res.redirect('/unauthorized');
          } else {
            req.user = result.id;
            next();
          }
        }
      });
    } else {
      req.flash(
        'error_msg',
        'You need to login as ADMIN in order to view that source!'
      );
      res.redirect('/unauthorized');
    }
  }
};




const forwardAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, result) => {
      if (err) {
        next();
      } else {
        const data = await selectID(result.id);
        if (data.length === 0) {
          next();
        } else {
          req.user = result.id;
          res.redirect('/admin/dashboard');
        }
      }
    });
  } else {
    next();
  }
};

module.exports = { requireAuth, forwardAuth };
