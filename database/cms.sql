USE rms;

-- Create admin table
CREATE TABLE IF NOT EXISTS `admin` (
    `admin_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `resetLink` VARCHAR(255) DEFAULT '',
    PRIMARY KEY(`admin_id`)
);

-- Create department table
CREATE TABLE IF NOT EXISTS `department` (
    `dept_id` VARCHAR(255) NOT NULL UNIQUE,
    `d_name` VARCHAR(255) NOT NULL UNIQUE,
     PRIMARY KEY (`dept_id`)
);

-- Create course table
CREATE TABLE IF NOT EXISTS `course` (
    `c_id` VARCHAR(100) NOT NULL UNIQUE,
    `semester` INT NOT NULL,
    `c_name` VARCHAR(255) NOT NULL,
    `credits` INT NOT NULL,
    `dept_id` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`c_id`),
    CONSTRAINT `course_fk0` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create student table
CREATE TABLE IF NOT EXISTS `student` (
    `s_id` INT NOT NULL AUTO_INCREMENT,
    `s_name` VARCHAR(255) NOT NULL,
    `rollNumber` INT NOT NULL,
    `gender` VARCHAR(6) NOT NULL,
    `dob` DATE NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `s_address` VARCHAR(255) NOT NULL,
    `dept_id` VARCHAR(255) NOT NULL ,
    `contact` VARCHAR(12) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `joining_date` DATE,
    `resetLink` VARCHAR(255) DEFAULT '',
    PRIMARY KEY (`s_id`),
    CONSTRAINT `student_fk0` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);


-- Create staff table
CREATE TABLE IF NOT EXISTS `staff` (
    `st_id` INT NOT NULL AUTO_INCREMENT,
    `st_name` VARCHAR(255) NOT NULL,
    `gender` VARCHAR(6) NOT NULL,
    `dob` DATE NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `st_address` VARCHAR(255) NOT NULL,
    `contact` VARCHAR(12) NOT NULL,
    `dept_id` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `resetLink` VARCHAR(255) DEFAULT '',
    PRIMARY KEY (`st_id`),
    CONSTRAINT `staff_fk0` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);



--  CREATE CLASS TABLE
CREATE TABLE IF NOT EXISTS `class` (
    `class_id` INT NOT NULL AUTO_INCREMENT UNIQUE, 
    `semester` INT NOT NULL,
    `c_id` VARCHAR(100),
    `st_id` INT NOT NULL,
    PRIMARY KEY (`class_id`),
    CONSTRAINT `class_fk0` FOREIGN KEY (`c_id`) REFERENCES `course`(`c_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `class_fk1` FOREIGN KEY (`st_id`) REFERENCES `staff`(`st_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);


-- Create result table
CREATE TABLE IF NOT EXISTS `result` (
    `res_id` INT NOT NULL AUTO_INCREMENT,
    `semester` INT NOT NULL,
    `rollNumber` INT NOT NULL,
    `gpa` DECIMAL(5,2) NOT NULL,
    `dept_id` VARCHAR(255),
    `c_id` VARCHAR(255),
    `s_id` INT NOT NULL,
    PRIMARY KEY (`res_id`),
    CONSTRAINT `result_fk0` FOREIGN KEY (`s_id`) REFERENCES `student`(`s_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `result_fk1` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT `result_fk2` FOREIGN KEY (`c_id`) REFERENCES `course`(`c_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);
