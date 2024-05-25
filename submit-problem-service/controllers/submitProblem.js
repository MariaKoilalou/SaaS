const axios = require('axios');
const encrypt = require('../utils/encrypt');

exports.submit = (req, res, next) => {

    let validationError = false, errors = [];

    if (validationError) return res.status(400).json({ message: 'Validation Error!', errors: errors })

    // construct data obj that will be sent with axios
    const data = {
        type: 'QUESTION CREATE',
        dateCreated: Date.now(),
    }

    // set the headers (both AUTH and ORIGIN)
    const headers = {
        "CUSTOM-SERVICES-HEADER": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))
    };

    const config = { method: 'post', headers: headers, data: data };

    // make the request
    axios(config)
        .then(result =>
            res.status(200).json({ message: 'Your problem was submitted successfully.', type: 'success' })
        )
        .catch(err =>
            res.status(500).json({ message: 'Internal server error.', type: 'error' })
        )

}
