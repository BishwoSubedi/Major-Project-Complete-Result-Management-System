const express = require('express');
const path = require('path');

const controller = require('../controllers/staff');
const { requireAuth, forwardAuth } = require('../middlewares/staffAuth');
const router = express.Router();
// router.use(express.urlencoded({ extended: true }));


// login page
router.get('/login', forwardAuth, controller.getLogin);
router.post('/login', controller.postLogin);

router.get('/dashboard', requireAuth, controller.getDashboard);
router.get('/profile', requireAuth, controller.getProfile);
router.get('/logout', requireAuth, controller.getLogout);

// Result
// 5.1 Select Result
router.get('/getresult', requireAuth, controller.getResult);


//Fetching course according to semester and departments
router.get('/fetchcourses', requireAuth, controller.fetchCourses);

// 5.2 Add Result
router.get('/addresult', requireAuth, controller.getAddResult);
router.post('/addresult', requireAuth, controller.postAddResult);


/// 5.3 Update Result
router.get('/setresult/:id', requireAuth, controller.getSetResult);
router.post('/setresult/:id', requireAuth, controller.postSetResult);



// 1.5 FORGET PASSWORD
router.get('/forgot-password', forwardAuth, controller.getForgotPassword);
router.put('/forgot-password', controller.forgotPassword);

// 1.6 RESET PASSWORD
router.get('/resetpassword/:id', forwardAuth, controller.getResetPassword);
router.put('/resetpassword', controller.resetPassword);

module.exports = router;
