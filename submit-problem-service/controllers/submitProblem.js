const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer to handle the file upload in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.uploadFile = upload.single('pythonFile');  // Ensure the same 'pythonFile' name is used

exports.submit = async (req, res) => {
    // Ensure the file and problemType are provided
    if (!req.file) {
        return res.status(400).json({ message: 'File missing. Please provide a .py file and problemType.' });
    }

    try {
        // Log the incoming file and problem type
        console.log('Received file:', req.file.originalname);

        // Process the problem based on the `problemType`
        let solution = {};

    } catch (error) {
        console.error('Error processing problem:', error.message);
        return res.status(500).json({
            message: 'Internal server error. Unable to process problem.',
            error: error.message
        });
    }
};





