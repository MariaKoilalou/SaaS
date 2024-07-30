const axios = require('axios');
const encrypt = require('../utils/encrypt');

exports.submit = async (req, res) => {
    // Example of adding simple validation
    if (!req.body.description || req.body.description.trim() === '') {
        return res.status(400).json({ message: 'Validation Error!', errors: ['Problem description is required.'] });
    }

    // Construct data object that will be sent with axios
    const data = {
        type: 'PROBLEM SUBMIT',
        description: req.body.description,
        dateCreated: new Date(), // Using JavaScript Date object, formatted by backend if needed
    };

    // Set the headers (including encrypted authorization and content type)
    const headers = {
        "Custom-Services-Header": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))
    };

    try {
        // Use axios.post directly for cleaner code
        const response = await axios.post('http://your-target-url/api/problems', data, { headers });

        // Check response status and content
        if (response.status === 201) {
            return res.status(200).json({
                message: 'Your problem was submitted successfully.',
                type: 'success',
                problemId: response.data.problemId // Assuming the response contains a problemId
            });
        } else {
            throw new Error('Unexpected response status: ' + response.status);
        }
    } catch (err) {
        console.error('Error when submitting problem:', err.message);
        return res.status(500).json({
            message: 'Internal server error. Unable to submit problem.',
            type: 'error'
        });
    }
};

